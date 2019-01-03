import * as util from 'util';
import * as fs from 'fs-extra';
import * as logger from 'heroku-logger';
import * as path from 'path';

import * as utilities from './utilities';
import * as poolParse from './poolParse';
import * as hubAuth from './hubAuth';
import * as redis from './redisNormal';

import { deployRequest, lineParserResult, poolOrg } from './types';

const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);

export async function poolBuild() {
  const msg = await redis.lpop('poolDeploys');
  if (msg) {
    const keypath = await hubAuth();
    const msgJSON: deployRequest = JSON.parse(msg);
    // handling deletes
    if (msgJSON.delete) {
      logger.debug(`deleting org with username ${msgJSON.username}`);
      try {
        utilities.loggerFunction(
          await exec(
            `sfdx force:auth:jwt:grant --json --clientid ${
              process.env.CONSUMERKEY
            } --username ${
              msgJSON.username
            } --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`
          )
        );
        logger.debug('connected to the org');

        utilities.loggerFunction(
          await exec(`sfdx force:org:delete -p -u ${msgJSON.username}`)
        );
        logger.debug('org deleted');
        return true;
      } catch (err) {
        logger.error('failed to delete an org!', err);
        logger.error('failed to delete an org!', msgJSON);
        return false;
      }
    } else {
      // non-deletes
      logger.debug(msgJSON.deployId);

      logger.debug('building a pool org!');

      // clone repo into local fs
      // checkout only the specified branch, if specified
      let gitCloneCmd = `git clone https://github.com/${msgJSON.username}/${
        msgJSON.repo
      }.git ${msgJSON.deployId}`;

      // special handling for branches

      if (msgJSON.branch) {
        // logger.debug('It is a branch!');
        gitCloneCmd = `git clone -b ${
          msgJSON.branch
        } --single-branch https://github.com/${msgJSON.username}/${
          msgJSON.repo
        }.git ${msgJSON.deployId}`;
        // logger.debug(gitCloneCmd);
      }
      const cloneDir = path.join(__dirname, '../tmp', msgJSON.deployId);
      const tmpDir = path.join(__dirname, '../tmp');

      fs.ensureDirSync(cloneDir);

      const poolMessage: poolOrg = {
        repo: msgJSON.repo,
        githubUsername: msgJSON.username,
        openCommand: 'placeholder',
        createdDate: new Date()
      };
      if (msgJSON.branch) {
        poolMessage.branch = msgJSON.branch;
      }

      utilities.loggerFunction(await exec(gitCloneCmd, { cwd: tmpDir }));
      if (!fs.existsSync(`${cloneDir}/orgInit.sh`)) {
        logger.error('There is no orgInit.sh file in the repo');
        logger.debug(`${cloneDir}/orgInit.sh`);
        throw 'There is no orgInit.sh file in the repo';
      } else {
        logger.debug('orgInit exists!');
      }

      const parseResults: lineParserResult = await poolParse(
        path.join(cloneDir, 'orgInit.sh')
      );

      // a few things we have to do post-org-creation so we can still return it to the end user
      logger.debug(`open command is ${parseResults.openLine}`);
      poolMessage.openCommand = parseResults.openLine;
      if (parseResults.passwordLine) {
        poolMessage.passwordCommand = parseResults.passwordLine;
      }

      // run the file
      try{

        utilities.loggerFunction(
          await execFile('./orgInit.sh', { cwd: cloneDir, timeout: 1000000 })
        );
        const displayResults = await exec('sfdx force:org:display --json', {
          cwd: cloneDir
        });
        poolMessage.displayResults = JSON.parse(displayResults.stdout).result;
        const key = await utilities.getKey(msgJSON);
        await redis.rpush(key, JSON.stringify(poolMessage));
        await exec(`rm -rf ${msgJSON.deployId}`, { cwd: tmpDir });
        return true;
      } catch (error){
        logger.error(`error runnning file for ${msgJSON.username}/${msgJSON.repo}`, error);
        return false;
      }
    }
  } else {
    logger.debug('nothing for me to do');
    return false;
  }
}
