// serves as a shared build path for pool and non-pool orgs
import * as fs from 'fs-extra';
import {exec} from 'child_process';

import * as logger from 'heroku-logger';
import * as util from 'util';

import { clientDataStructure, deployRequest } from './types';
import { redis, deleteOrg, cdsPublish } from './redisNormal';
import { lineParse } from './lineParse';
import * as lineRunner from './lines';
import { timesToGA } from './timeTracking';

import * as utilities from './utilities';

const execProm = util.promisify(exec);

const build = async (msgJSON: deployRequest) => {
    fs.ensureDirSync('tmp');

    let clientResult = <clientDataStructure>{
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
      const gitCloneResult = await execProm(gitCloneCmd, { cwd: 'tmp' });
      logger.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
      clientResult.commandResults.push({
        command: gitCloneCmd,
        raw: gitCloneResult.stderr
      });
      if (!msgJSON.pool) await cdsPublish(clientResult);
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
      if (!msgJSON.pool) await cdsPublish(clientResult);
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
      if (!msgJSON.pool) await cdsPublish(clientResult);
      return true;
    }

    const localLineRunner = new lineRunner(
      msgJSON,
      parsedLines,
      redis,
      clientResult
    );

    try {
      clientResult = <clientDataStructure> await localLineRunner.runLines();
      timesToGA(msgJSON, clientResult);
    } catch (e) {
      logger.error('deployQueueCheck: Deployment error', msgJSON);
      logger.error('deployQueueCheck: Deployment error', e);  
      await deleteOrg(msgJSON.username);    
    }

    await fs.remove(`tmp/${msgJSON.deployId}`);
    return clientResult;

  }

  export { build };