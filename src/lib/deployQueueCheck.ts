import * as logger from 'heroku-logger';

import { getDeployRequest } from './redisNormal';
import { pooledOrgFinder }from './pooledOrgFinder';
import { build } from './commonBuild';

import { deployRequest } from './types';

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
