// checks the deploy queue and runs the process.  Can be run as a one-off dyno, or on a setInterval.
// testing: http://localhost:8443/launch?template=https://github.com/mshanemc/df17AppBuilding

import * as util from 'util';
import * as ua from 'universal-analytics';
import * as fs from 'fs-extra';
import * as logger from 'heroku-logger';

import * as redis from './redisNormal';
import * as utilities from './utilities';
import * as lineParse from './lineParse';
import * as lineRunner from './lines';
import * as pooledOrgFinder from './pooledOrgFinder';

import { clientDataStructure, deployRequest } from './types';

const exec = util.promisify(require('child_process').exec);

const ex = 'deployMsg';

const check = async () => {
  // pull the oldest thing on the queue
  const msg = await redis.lpop('deploys');
      // if it's empty, sleep a while and check again
  if (!msg) {
    return false;
  }

  const msgJSON: deployRequest = JSON.parse(msg);

  const visitor = ua(process.env.UA_ID || '0');

  // logger.debug(msgJSON);
  logger.debug(msgJSON.deployId);
  logger.debug(msgJSON.template);

  visitor.event('Deploy Request', msgJSON.template).send();


  const pooledOrg = await pooledOrgFinder(msgJSON);

  if (pooledOrg) {
    // already published appropriate messages for the page to handle from the pooledOrgFinder
    logger.debug('using a pooled org');	// throw an error to break out of the rest of the promise chain and ack
  } else {
    fs.ensureDirSync('tmp');

    const clientResult = <clientDataStructure>{
      deployId: msgJSON.deployId,
      complete: false,
      errors: [],
      commandResults: [],
      additionalUsers: [],
      mainUser: {}
    }

    // checkout only the specified branch, if specified
    let gitCloneCmd = `git clone https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;

    // special handling for branches
    if (msgJSON.branch) {
      gitCloneCmd = `git clone -b ${msgJSON.branch} --single-branch https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
    }

    try {
      const gitCloneResult = await exec(gitCloneCmd, { cwd: 'tmp'});
      logger.debug(gitCloneResult.stderr);
      clientResult.commandResults.push({
        command: gitCloneCmd,
        raw: gitCloneResult.stderr
      });
      await redis.publish(ex, JSON.stringify(clientResult));
    } catch (err){
      logger.warn(`bad repo: https://github.com/${msgJSON.username}/${msgJSON.repo}.git`);
      clientResult.errors.push({
        command: gitCloneCmd,
        error: err.stderr,
        raw: err
      });
      clientResult.complete = true;
      await redis.publish(ex, JSON.stringify(clientResult));
      return true;
    }

    // if you passed in a custom email address, we need to edit the config file and add the adminEmail property
    if (msgJSON.email) {
      logger.debug('write a file for custom email address', msgJSON);
      const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
      const configFileJSON = JSON.parse(fs.readFileSync(location, 'utf8'));
      configFileJSON.adminEmail = msgJSON.email;
      fs.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
    }

    // grab the deploy script from the repo
    logger.debug(`going to look in the directory tmp/${msgJSON.deployId}/orgInit.sh`);

    let parsedLines = [];

    // use the default file if there's not one
    if (!fs.existsSync(`tmp/${msgJSON.deployId}/orgInit.sh`)) {
      logger.debug('no orgInit.sh.  Will use default');
      fs.writeFileSync(`tmp/${msgJSON.deployId}/orgInit.sh`,
        `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`
      );
    }

    try {
      parsedLines = await lineParse(msgJSON, visitor);
      logger.debug('these are the parsed lines:');
      logger.debug(JSON.stringify(parsedLines));
    } catch (err){

    }

    const localLineRunner = new lineRunner(msgJSON, parsedLines, redis, clientResult);
    await localLineRunner.runLines();

    visitor.event('deploy complete', msgJSON.template).send();

  }

  // TODO: change to rimraf for simplicity
  await exec(`rm -rf tmp/${msgJSON.deployId}`);
  return true;
};

export = check;