// checks the deploy queue and runs the process.  Can be run as a one-off dyno, or on a setInterval.
// testing: http://localhost:8443/launch?template=https://github.com/mshanemc/df17AppBuilding

import * as util from 'util';
import * as fs from 'fs-extra';
import * as logger from 'heroku-logger';

import { redis, deleteOrg, getDeployRequest, cdsPublish } from './redisNormal';
import { lineParse } from './lineParse';
import * as lineRunner from './lines';
import { pooledOrgFinder }from './pooledOrgFinder';
import * as utilities from './utilities';
import { timesToGA } from './timeTracking';

import { clientDataStructure, deployRequest } from './types';

const exec = util.promisify(require('child_process').exec);

const check = async () => {
  // pull the oldest thing on the queue
  // will throw an error if the queue is empty.  handle somewhere
  let msgJSON:deployRequest;

  try {
    msgJSON = await getDeployRequest(true);
  } catch (e) {
    // throws on empty queue
    return false;
  }

  try {
    msgJSON.visitor.event('Deploy Request', msgJSON.template).send();
  } catch (e){
    logger.warn('failed to send GA event');
  }
  

  if (await pooledOrgFinder(msgJSON)) {
    logger.debug('deployQueueCheck: using a pooled org');
  } else {
    fs.ensureDirSync('tmp');

    const clientResult = <clientDataStructure>{
      deployId: msgJSON.deployId,
      complete: false,
      errors: [],
      commandResults: [],
      additionalUsers: [],
      mainUser: {},
      browserStartTime: msgJSON.createdTimestamp || new Date(),
      buildStartTime: new Date()
    };

    const gitCloneCmd = utilities.getCloneCommand(msgJSON);

    try {
      const gitCloneResult = await exec(gitCloneCmd, { cwd: 'tmp' });
      logger.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
      clientResult.commandResults.push({
        command: gitCloneCmd,
        raw: gitCloneResult.stderr
      });
      await cdsPublish(clientResult);
    } catch (err) {
      logger.warn(
        `deployQueueCheck: bad repo--https://github.com/${msgJSON.username}/${
          msgJSON.repo
        }.git`
      );
      clientResult.errors.push({
        command: gitCloneCmd,
        error: err.stderr,
        raw: err
      });
      clientResult.complete = true;
      await cdsPublish(clientResult);
      return true;
    }

    // if you passed in a custom email address, we need to edit the config file and add the adminEmail property
    if (msgJSON.email) {
      logger.debug(
        'deployQueueCheck: write a file for custom email address',
        msgJSON
      );
      const location = `tmp/${
        msgJSON.deployId
      }/config/project-scratch-def.json`;
      const configFileJSON = JSON.parse(fs.readFileSync(location, 'utf8'));
      configFileJSON.adminEmail = msgJSON.email;
      fs.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
    }

    // grab the deploy script from the repo
    logger.debug(
      `deployQueueCheck: going to look in the directory tmp/${
        msgJSON.deployId
      }/orgInit.sh`
    );

    // use the default file if there's not one
    if (!fs.existsSync(`tmp/${msgJSON.deployId}/orgInit.sh`)) {
      logger.debug('deployQueueCheck: no orgInit.sh.  Will use default');
      fs.writeFileSync(
        `tmp/${msgJSON.deployId}/orgInit.sh`,
        `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`
      );
    }

    let parsedLines;
    
    try {
      parsedLines = await lineParse(msgJSON);
    } catch (e) {
      clientResult.errors.push({
        command: 'line parsing',
        error: e,
        raw: e
      });
      clientResult.complete = true;
      await cdsPublish(clientResult);
      return true;
    }

    const localLineRunner = new lineRunner(
      msgJSON,
      parsedLines,
      redis,
      clientResult
    );

    try {
      const output = <clientDataStructure> await localLineRunner.runLines();
      timesToGA(msgJSON, output);
    } catch (e) {
      logger.error('deployQueueCheck: Deployment error', msgJSON);
      logger.error('deployQueueCheck: Deployment error', e);  
      await deleteOrg(msgJSON.username);    
    }
  }

  await fs.remove(`tmp/${msgJSON.deployId}`);
  return true;

};

export = check;
