// the purpose of this file is to wrap any interaction with Redis.
//  This lets us keep key names in a single place, and handle any validate / stringify / parse operations.
// Users of this file just get/put/delete things as if redis is fancier than it really is

import Redis from 'ioredis';
import logger from 'heroku-logger';
import ua from 'universal-analytics';

import { DeleteRequest, DeployRequest, PoolConfig } from './types';

import { getPoolKey } from './namedUtilities';
import { filterUnsanitized } from './shellSanitize';
import { CDS } from './CDS';
import { processWrapper } from './processWrapper';
import equal from 'fast-deep-equal';

const cdsExchange = 'deployMsg';
const deployRequestExchange = 'deploys';
export const poolDeployExchange = 'poolDeploys';
const orgDeleteExchange = 'orgDeletes';
const herokuCDSExchange = 'herokuCDSs';
const leadQueue = 'leads';
const failedLeadQueue = 'failedLeads';

const days31asSeconds = 31 * 24 * 60 * 60;

// for accessing the redis directly.  Less favored
const redis = new Redis(processWrapper.REDIS_URL);

const deleteOrg = async (username: string): Promise<void> => {
    logger.debug(`org delete requested for ${username}`);
    const msg: DeleteRequest = {
        username: filterUnsanitized(username),
        delete: true,
        created: new Date()
    };
    await redis.rpush(orgDeleteExchange, JSON.stringify(msg));
};

const putHerokuCDS = async (cds: CDS): Promise<void> => {
    if (cds.herokuResults.length > 0) {
        await redis.lpush(herokuCDSExchange, JSON.stringify(cds));
    }
};

const getHerokuCDSs = async (): Promise<CDS[]> => {
    const CDSs: CDS[] = (await redis.lrange(herokuCDSExchange, 0, -1)).map(queueItem => JSON.parse(queueItem));
    return CDSs;
};

const getAppNamesFromHerokuCDSs = async (salesforceUsername: string, expecting = true) => {
    // get all the CDSs
    const herokuCDSs = await getHerokuCDSs();

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

const getDeleteQueueSize = async () => redis.llen(orgDeleteExchange);

const getDeleteRequest = async () => {
    const msg = await redis.lpop(orgDeleteExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg) as DeleteRequest;
        return msgJSON;
    } else {
        throw new Error('delete request queue is empty');
    }
};

const getDeployRequestSize = async () => redis.llen(deployRequestExchange);

const getDeployRequest = async (log?: boolean) => {
    const msg = await redis.lpop(deployRequestExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg) as DeployRequest;
        // hook back up the UA events since they're lost in the queue

        if (processWrapper.UA_ID && msgJSON.visitor) {
            msgJSON.visitor = ua(processWrapper.UA_ID);
        }
        if (log) {
            logger.debug(`deployQueueCheck: found a msg for ${msgJSON.deployId}`, msgJSON);
        }
        return msgJSON;
    } else {
        throw new Error('regular deploy request queue is empty');
    }
};

const putDeployRequest = async (depReq: DeployRequest, log?: boolean) => {
    await redis.rpush(deployRequestExchange, JSON.stringify(depReq));
    if (log) {
        logger.debug('redis: added to deploy queue', depReq);
    }
};

const putPoolRequest = async (poolReq: DeployRequest, log?: boolean) => {
    await redis.rpush(poolDeployExchange, JSON.stringify(poolReq));
    if (log) {
        logger.debug('redis: added to pool queue', poolReq);
    }
};

const getPoolRequest = async (log?: boolean) => {
    const msg = await redis.lpop(poolDeployExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg) as DeployRequest;
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
        const cds = JSON.parse(retrieved) as CDS;
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
        const cds = JSON.parse(retrieved) as CDS;
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
        // eslint-disable-next-line no-await-in-loop
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
        const poolOrg = JSON.parse(msg) as CDS;
        if (log) {
            logger.debug(`pooledOrgFinder: found an org in ${key}`, poolOrg);
        }
        return poolOrg;
    } else {
        throw new Error(`no queued orgs for ${key}`);
    }
};

const putPooledOrg = async (depReq: DeployRequest, poolMessage: CDS): Promise<void> => {
    const key = getPoolKey(depReq);
    await redis.rpush(key, JSON.stringify(poolMessage));
};

const getPoolDeployRequestQueueSize = async () => redis.llen(poolDeployExchange);

/**
 * given a PoolConfig, it finds how many requests are already in the pool deploy queue, to avoid putting in more than needed
 */
const getPoolDeployCountByRepo = async (pool: PoolConfig) => {
    const poolRequests = await redis.lrange(poolDeployExchange, 0, -1);
    return poolRequests.map(pr => JSON.parse(pr)).filter((pr: DeployRequest) => equal(pr.repos, pool.repos)).length;
};

const putLead = async lead => {
    if (processWrapper.sfdcLeadCaptureServlet) {
        await redis.rpush(leadQueue, JSON.stringify(lead));
    }
};

const putFailedLead = async lead => {
    if (processWrapper.sfdcLeadCaptureServlet) {
        await redis.rpush(failedLeadQueue, JSON.stringify(lead));
    }
};

const getLead = async () => {
    const lead = await redis.lpop(leadQueue);
    return JSON.parse(lead);
};

const getLeadQueueSize = async () => redis.llen(leadQueue);

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
    getHerokuCDSs,
    putLead,
    getLead,
    getLeadQueueSize,
    putFailedLead
};
