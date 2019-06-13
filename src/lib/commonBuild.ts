// serves as a shared build path for pool and non-pool orgs
import * as fs from 'fs-extra';
import * as logger from 'heroku-logger';

import { clientDataStructure, deployRequest } from './types';
import { redis, deleteOrg, cdsPublish, putHerokuCDS } from './redisNormal';
import { lineParse } from './lineParse';
import * as lineRunner from './lines';
import { timesToGA } from './timeTracking';
import { execProm } from './execProm';
import * as utilities from './utilities';
import { poolParse} from './poolParse';


const build = async (msgJSON: deployRequest) => {
    fs.ensureDirSync('tmp');

    let clientResult = <clientDataStructure>{
      deployId: msgJSON.deployId,
      complete: false,
      errors: [],
      commandResults: [],
      additionalUsers: [],
      herokuResults: [],
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
      return clientResult;
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

    const orgInitPath = `tmp/${msgJSON.deployId}/orgInit.sh`;

    // grab the deploy script from the repo
    logger.debug(
      `deployQueueCheck: going to look in the directory ${orgInitPath}`
    );

    // use the default file if there's not one
    if (!fs.existsSync(orgInitPath)) {
      logger.debug('deployQueueCheck: no orgInit.sh.  Will use default');
      fs.writeFileSync(
        orgInitPath,
        `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`
      );
    }

    let parsedLines;

    // reads the lines and removes and stores the open and password lines
    if (msgJSON.pool) {
      clientResult.poolLines = await poolParse(orgInitPath)
    }
    
    try {
      parsedLines = await lineParse(msgJSON);
      clientResult.lineCount = parsedLines.length + 1; //1 extra to account for the git clone command 
      await cdsPublish(clientResult);
    } catch (e) {
      clientResult.errors.push({
        command: 'line parsing',
        error: e,
        raw: e
      });
      clientResult.complete = true;
      if (!msgJSON.pool) await cdsPublish(clientResult);
      return clientResult;
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
    
    // store in herokuCDS queue for synchronized deletion
    if (clientResult.herokuResults.length > 0) {
      await putHerokuCDS(clientResult);
    }
    return clientResult;

  }

  export { build };