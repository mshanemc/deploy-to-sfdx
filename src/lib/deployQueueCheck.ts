// checks the deploy queue and runs the process.  Can be run as a one-off dyno, or on a setInterval.
import * as util from 'util';
import * as ua from 'universal-analytics';
import * as fs from 'fs';
import * as logger from 'heroku-logger';

import * as redis from './redisNormal';
import * as utilities from './utilities';
import * as lineParse from './lineParse';
import * as lineRunner from './lines';
import * as pooledOrgFinder from './pooledOrgFinder';

import { deployRequest } from './types';

const exec = util.promisify(require('child_process').exec);

const ex = 'deployMsg';

const check = async () => {
  // pull the oldest thing on the queue
  const msg = await redis.lpop('deploys');
      // if it's empty, sleep a while and check again
  if (!msg) {
    return false;
  }

  console.log(msg);

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
    // checkout only the specified branch, if specified
    let gitCloneCmd = `cd tmp;git clone https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;

    // special handling for branches
    if (msgJSON.branch) {
      // logger.debug('It is a branch!');
      gitCloneCmd = `cd tmp;git clone -b ${msgJSON.branch} --single-branch https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
      // logger.debug(gitCloneCmd);
    }

    try {
      const gitCloneResult = await exec(gitCloneCmd);
      logger.debug(gitCloneResult.stderr);
      await redis.publish(ex, utilities.bufferKey(gitCloneResult.stderr, msgJSON.deployId));
    } catch (err){
      logger.warn(`bad repo: https://github.com/${msgJSON.username}/${msgJSON.repo}.git}`);
      await redis.publish(ex, utilities.bufferKey(`There was an error cloning https://github.com/${msgJSON.username}/${msgJSON.repo}.git}`, msgJSON.deployId));
    }

    // git outputs to stderr for unfathomable reasons

    // if you passed in a custom email address, we need to edit the config file and add the adminEmail property
    if (msgJSON.email) {
      console.log('write a file for custom email address');
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
      parsedLines.push(`cd tmp;cd ${msgJSON.deployId};sfdx force:org:create -f config/project-scratch-def.json -s -d 1`);
      parsedLines.push(`cd tmp;cd ${msgJSON.deployId};sfdx force:source:push`);
      parsedLines.push(`cd tmp;cd ${msgJSON.deployId};sfdx force:org:open`);
    } else { // read the lines from the file
      logger.debug('found a orgInit.sh');
      parsedLines = await lineParse(msgJSON, visitor);
    }

    logger.debug('these are the parsed lines:');
    logger.debug(JSON.stringify(parsedLines));

    const localLineRunner = new lineRunner(msgJSON, parsedLines, redis, visitor);
    await localLineRunner.runLines();
    await redis.publish(ex, utilities.bufferKey('ALLDONE', msgJSON.deployId));

    visitor.event('deploy complete', msgJSON.template).send();

  }
  await exec(`cd tmp;rm -rf ${msgJSON.deployId}`);
  return true;
};

export = check;