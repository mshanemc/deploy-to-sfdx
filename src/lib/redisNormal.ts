import * as Redis from 'ioredis';
import * as logger from 'heroku-logger';
import * as ua from 'universal-analytics';

import {
  DeleteRequest,
  deployRequest,
  clientDataStructure,
  poolOrg
} from './types';

import utilities = require('./utilities');
import * as shellSanitize from './shellSanitize';

const cdsExchange = 'deployMsg';
const deployRequestExchange = 'deploys';
const poolDeployExchange = 'poolDeploys';
// for accessing the redis directly.  Less favored
const redis = new Redis(process.env.REDIS_URL);

const deleteOrg = async (username: string) => {
  if (shellSanitize(username)){
    const msg: DeleteRequest = {
      username,
      delete: true
    };
    await redis.publish(poolDeployExchange, JSON.stringify(msg));
  } else {
    throw new Error(`invalid username ${username}`);
  }

};

const getDeployRequest = async (log?: boolean) => {
  const msg = await redis.lpop(deployRequestExchange);
  if (msg) {
    const msgJSON = <deployRequest>JSON.parse(msg);
    // hook back up the UA events since they're lost in the queue

    if (process.env.UA_ID && msgJSON.visitor){
      msgJSON.visitor = ua(process.env.UA_ID);
    }
    if (log) {
      logger.debug(
        `deployQueueCheck: found a msg for ${msgJSON.deployId}`,
        msgJSON
      );
    }
    return msgJSON;
  } else {
    throw new Error('regular deploy request queue is empty');
  }
};

const putDeployRequest = async (depReq: deployRequest, log?: boolean) => {
  await redis.rpush(deployRequestExchange, JSON.stringify(depReq));
  logger.debug('redis: added to deploy queue', putDeployRequest);
};

const putPoolRequest = async (poolReq: deployRequest, log?: boolean) => {
  await redis.rpush(poolDeployExchange, JSON.stringify(poolReq));
};

const getPoolRequest = async (log?: boolean) => {
  const msg = await redis.lpop(poolDeployExchange);
  if (msg) {
    const msgJSON = <deployRequest>JSON.parse(msg);
    if (log) {
      logger.debug('poolQueueCheck: found a msg', msgJSON);
    }
    return msgJSON;
  } else {
    throw new Error('pool request queue is empty');
  }
};

const cdsPublish = async (cds: clientDataStructure) => {
  await redis.publish(cdsExchange, JSON.stringify(cds));
};

const getKeys = async () => {
  const keys = await redis.keys('*');
  const output = [];
  for (const key of keys) {
    const size = await redis.llen(key);
    output.push({
      repo: key,
      size
    });
  }
  return output;
};

// returns finished orgs from a pool
const getPooledOrg = async (key: string, log?: boolean): Promise<poolOrg> => {
  const msg = await redis.lpop(key);
  if (msg) {
    const poolOrg = <poolOrg>JSON.parse(msg);
    if (log) {
      logger.debug(`pooledOrgFinder: found an org in ${key}`, poolOrg);
    }
    return poolOrg;
  } else {
    throw new Error(`no queued orgs for ${key}`);
  }
};

const putPooledOrg = async (depReq: deployRequest, poolMessage: poolOrg) => {
  const key = await utilities.getKey(depReq);
  await redis.rpush(key, JSON.stringify(poolMessage));
};

const getPoolDeployRequestQueueSize = async () => redis.llen(poolDeployExchange);

const getPoolDeployCountByRepo = async (username: string, repo: string) => {
  const poolRequests = await redis.lrange(poolDeployExchange, 0, -1);
  return poolRequests
    .map( pr => JSON.parse(pr))
    .filter( (pr: deployRequest) => pr.repo === repo && pr.username === username)
    .length
};

export {
  redis,
  deleteOrg,
  deployRequestExchange,
  getDeployRequest,
  cdsExchange,
  cdsPublish,
  putDeployRequest,
  putPoolRequest,
  getKeys,
  getPooledOrg,
  putPooledOrg,
  getPoolRequest,
  getPoolDeployRequestQueueSize,
  getPoolDeployCountByRepo
};
