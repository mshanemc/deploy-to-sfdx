import * as util from 'util';
import * as fs from 'fs-extra';
import * as logger from 'heroku-logger';
import * as path from 'path';
import * as stripcolor from 'strip-color';
import * as utilities from './utilities';
import * as poolParse from './poolParse';
import { auth, getKeypath } from './hubAuth';
import { getPoolRequest, putPooledOrg } from './redisNormal';

import { deployRequest, lineParserResult, poolOrg } from './types';

const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);

export async function poolBuild() {
  let msgJSON;
  try { 
    msgJSON = await getPoolRequest(true);
  } catch (e){
    if (e.message === 'pool request queue is empty'){
      logger.warn(`failed to build pool: ${e.message}`);
    } else {
      logger.error(`failed to build pool: ${e.message}`);
    }
    return false;
  }
  
  const authResult = await auth();

  // handling deletes
  if (msgJSON.delete) {
    await handleOrgDelete(msgJSON);
  } else {
    // non-deletes
    logger.debug('building a pool org!', msgJSON);

    const gitCloneCmd = utilities.getCloneCommand(msgJSON);
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
      logger.error('There is no orgInit.sh file in the repo', msgJSON);
      throw new Error('There is no orgInit.sh file in the repo');
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
    try {
      await execFile('./orgInit.sh', { cwd: cloneDir, timeout: 1000000 })
    } catch (e) {
      throw new Error(e);
    }

    try {
      const displayResults = await exec('sfdx force:org:display --json', { cwd: cloneDir });
      poolMessage.displayResults = JSON.parse(stripcolor(displayResults.stdout)).result;
    } catch (e) {
      // console.error('error in force:org:display');
      throw new Error(e);
    }
    try {
      await putPooledOrg(msgJSON, poolMessage);
      await fs.remove(`${tmpDir}/${msgJSON.deployId}`);
      return true;
    } catch (error) {
      logger.error(
        `error runnning file for ${msgJSON.username}/${msgJSON.repo}`,
        error
      );
      await fs.remove(`${tmpDir}/${msgJSON.deployId}`);
      return false;
    }
  }
}

const handleOrgDelete = async (depReq: deployRequest) => {
  logger.debug(`deleting org with username ${depReq.username}`);
  try {
    utilities.loggerFunction(
      await exec(
        `sfdx force:auth:jwt:grant --json --clientid ${
          process.env.CONSUMERKEY
        } --username ${
          depReq.username
        } --jwtkeyfile ${await getKeypath()} --instanceurl https://test.salesforce.com -s`
      )
    );
    logger.debug('connected to the org');

    utilities.loggerFunction(
      await exec(`sfdx force:org:delete -p -u ${depReq.username}`)
    );
    logger.debug('org deleted');
    return true;
  } catch (err) {
    logger.error('failed to delete an org!', err);
    logger.error('failed to delete an org!', depReq);
    return false;
  }
};
