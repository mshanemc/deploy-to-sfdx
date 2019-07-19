import * as Redis from 'ioredis';
import * as logger from 'heroku-logger';
import * as ua from 'universal-analytics';

import { DeleteRequest, deployRequest, poolConfig } from './types';

import utilities = require('./utilities');
import { shellSanitize } from './shellSanitize';
import { CDS } from './CDS';

const cdsExchange = 'deployMsg';
const deployRequestExchange = 'deploys';
const poolDeployExchange = 'poolDeploys';
const orgDeleteExchange = 'orgDeletes';
const herokuCDSExchange = 'herokuCDSs';

const days31asSeconds = 31 * 24 * 60 * 60;

// for accessing the redis directly.  Less favored
const redis = new Redis(process.env.REDIS_URL);

const deleteOrg = async (username: string) => {
    logger.debug(`org delete requested for ${username}`);
    if (shellSanitize(username)) {
        const msg: DeleteRequest = {
            username,
            delete: true
        };
        await redis.rpush(orgDeleteExchange, JSON.stringify(msg));
    } else {
        throw new Error(`invalid username ${username}`);
    }
};

const putHerokuCDS = async (cds: CDS) => {
    return await redis.lpush(herokuCDSExchange, JSON.stringify(cds));
};

const getHerokuCDSs = async () => {
    const CDSs: CDS[] = (await redis.lrange(herokuCDSExchange, 0, -1)).map(queueItem => JSON.parse(queueItem));
    return CDSs;
};

const getAppNamesFromHerokuCDSs = async (salesforceUsername: string, expecting: boolean = true) => {
    // get all the CDSs
    let herokuCDSs = await getHerokuCDSs();

    if (herokuCDSs.length === 0) {
        return [];
    }
    // find the matching username
    const matchedCDSIndex = herokuCDSs.findIndex(cds => cds.mainUser.username === salesforceUsername);

    if (matchedCDSIndex < 0) {
        if (expecting) {
            logger.error(`no heroku CDS found for username ${salesforceUsername}`);
        } else {
            logger.debug(`no heroku CDS found for username ${salesforceUsername}`);
        }
        return [];
    }

    logger.debug(`found matching cds ${salesforceUsername} === ${herokuCDSs[matchedCDSIndex].mainUser.username}`);

    const matched = herokuCDSs.splice(matchedCDSIndex, 1);

    await redis.del(herokuCDSExchange);
    if (herokuCDSs.length > 0) {
        // clear the queue and push the unmatched stuff back
        await redis.lpush(herokuCDSExchange, ...herokuCDSs.map(cds => JSON.stringify(cds)));
    }

    // return array of appnames
    return matched[0].herokuResults.map(result => result.appName);
};

const getDeleteQueueSize = async () => {
    return await redis.llen(orgDeleteExchange);
};

const getDeleteRequest = async () => {
    const msg = await redis.lpop(orgDeleteExchange);
    if (msg) {
        const msgJSON = <DeleteRequest>JSON.parse(msg);
        return msgJSON;
    } else {
        throw new Error('delete request queue is empty');
    }
};

const getDeployRequestSize = async () => {
    return redis.llen(deployRequestExchange);
};

const getDeployRequest = async (log?: boolean) => {
    const msg = await redis.lpop(deployRequestExchange);
    if (msg) {
        const msgJSON = <deployRequest>JSON.parse(msg);
        // hook back up the UA events since they're lost in the queue

        if (process.env.UA_ID && msgJSON.visitor) {
            msgJSON.visitor = ua(process.env.UA_ID);
        }
        if (log) {
            logger.debug(`deployQueueCheck: found a msg for ${msgJSON.deployId}`, msgJSON);
        }
        return msgJSON;
    } else {
        throw new Error('regular deploy request queue is empty');
    }
};

const putDeployRequest = async (depReq: deployRequest, log?: boolean) => {
    await redis.rpush(deployRequestExchange, JSON.stringify(depReq));
    logger.debug('redis: added to deploy queue', depReq);
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

const cdsDelete = async (deployId: string) => {
    const retrieved = await redis.get(deployId);
    if (retrieved) {
        const cds = <CDS>JSON.parse(retrieved);
        await deleteOrg(cds.mainUser.username);
    }
    await redis.del(deployId);
};

const cdsPublish = async (cds: CDS) => {
    // write the CDS to its own deployId based key on redis
    if (!cds.isPool) {
        await redis.set(cds.deployId, JSON.stringify(cds), 'EX', days31asSeconds);
    }
};

const cdsRetrieve = async (deployId: string) => {
    const retrieved = await redis.get(deployId);
    if (retrieved) {
        const cds = <CDS>JSON.parse(retrieved);
        return cds;
    } else {
        logger.warn(`No cds results found for deployId ${deployId}`);
        return new CDS({
            deployId,
            complete: true,
            errors: [
                {
                    command: 'retrieval',
                    error: 'Results not found for your deployId. It may have been deleted or may have expired',
                    raw: ''
                }
            ]
        });
    }
};

const getKeysForCDSs = async () => {
    const deployIds = await redis.keys('*-*-*');
    return deployIds.filter(id => !id.includes('.'));
};

// not all keys...supposed to be getting pooled orgs
const getKeys = async () => {
    const keys = await redis.keys('*.*');
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
const getPooledOrg = async (key: string, log?: boolean): Promise<CDS> => {
    const msg = await redis.lpop(key);
    if (msg) {
        const poolOrg = <CDS>JSON.parse(msg);
        if (log) {
            logger.debug(`pooledOrgFinder: found an org in ${key}`, poolOrg);
        }
        return poolOrg;
    } else {
        throw new Error(`no queued orgs for ${key}`);
    }
};

const putPooledOrg = async (depReq: deployRequest, poolMessage: CDS) => {
    const key = await utilities.getKey(depReq);
    await redis.rpush(key, JSON.stringify(poolMessage));
};

const getPoolDeployRequestQueueSize = async () => redis.llen(poolDeployExchange);

const getPoolDeployCountByRepo = async (pool: poolConfig) => {
    const poolRequests = await redis.lrange(poolDeployExchange, 0, -1);
    return poolRequests
        .map(pr => JSON.parse(pr))
        .filter((pr: deployRequest) => pr.repo === pool.repo && pr.username === pool.user && pr.branch === pool.branch).length;
};

export {
    redis,
    deployRequestExchange,
    getDeployRequest,
    cdsExchange,
    cdsPublish,
    cdsRetrieve,
    cdsDelete,
    getDeployRequestSize,
    putDeployRequest,
    putPoolRequest,
    getKeys,
    getKeysForCDSs,
    getPooledOrg,
    putPooledOrg,
    getPoolRequest,
    getPoolDeployRequestQueueSize,
    getPoolDeployCountByRepo,
    orgDeleteExchange,
    getDeleteQueueSize,
    getDeleteRequest,
    deleteOrg,
    putHerokuCDS,
    getAppNamesFromHerokuCDSs,
    getHerokuCDSs
};
