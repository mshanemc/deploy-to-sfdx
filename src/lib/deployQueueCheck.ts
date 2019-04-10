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
import { build } from './commonBuild';

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
    await build(msgJSON);
  }
    
  return true;

};

export = check;
