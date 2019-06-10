"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require("ioredis");
const logger = require("heroku-logger");
const ua = require("universal-analytics");
const utilities = require("./utilities");
const shellSanitize_1 = require("./shellSanitize");
const cdsExchange = 'deployMsg';
exports.cdsExchange = cdsExchange;
const deployRequestExchange = 'deploys';
exports.deployRequestExchange = deployRequestExchange;
const poolDeployExchange = 'poolDeploys';
const orgDeleteExchange = 'orgDeletes';
exports.orgDeleteExchange = orgDeleteExchange;
const herokuCDSExchange = 'herokuCDSs';
const redis = new Redis(process.env.REDIS_URL);
exports.redis = redis;
const deleteOrg = async (username) => {
    logger.debug(`org delete requested for ${username}`);
    if (shellSanitize_1.shellSanitize(username)) {
        const msg = {
            username,
            delete: true
        };
        await redis.rpush(orgDeleteExchange, JSON.stringify(msg));
    }
    else {
        throw new Error(`invalid username ${username}`);
    }
};
exports.deleteOrg = deleteOrg;
const putHerokuCDS = async (cds) => {
    return await redis.lpush(herokuCDSExchange, JSON.stringify(cds));
};
exports.putHerokuCDS = putHerokuCDS;
const getHerokuCDSs = async () => {
    const CDSs = (await redis.lrange(herokuCDSExchange, 0, -1))
        .map(queueItem => JSON.parse(queueItem));
    return CDSs;
};
exports.getHerokuCDSs = getHerokuCDSs;
const getAppNamesFromHerokuCDSs = async (salesforceUsername) => {
    let herokuCDSs = (await redis.lrange(herokuCDSExchange, 0, -1))
        .map(queueItem => JSON.parse(queueItem));
    if (herokuCDSs.length === 0) {
        return [];
    }
    const matchedCDSIndex = herokuCDSs
        .findIndex((cds) => cds.mainUser.username === salesforceUsername);
    logger.debug(`found matching cds ${salesforceUsername} === ${herokuCDSs[matchedCDSIndex].mainUser.username}`);
    if (matchedCDSIndex < 0) {
        logger.error(`no heroku CDS found for username ${salesforceUsername}`);
        return [];
    }
    const matched = herokuCDSs
        .splice(matchedCDSIndex, 1);
    if (herokuCDSs.length > 0) {
        await redis.del(herokuCDSExchange);
        await redis.lpush(herokuCDSExchange, ...(herokuCDSs.map(cds => JSON.stringify(cds))));
    }
    return matched[0].herokuResults.map(result => result.appName);
};
exports.getAppNamesFromHerokuCDSs = getAppNamesFromHerokuCDSs;
const getDeleteQueueSize = async () => {
    return await redis.llen(orgDeleteExchange);
};
exports.getDeleteQueueSize = getDeleteQueueSize;
const getDeleteRequest = async () => {
    const msg = await redis.lpop(orgDeleteExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg);
        return msgJSON;
    }
    else {
        throw new Error('delete request queue is empty');
    }
};
exports.getDeleteRequest = getDeleteRequest;
const getDeployRequest = async (log) => {
    const msg = await redis.lpop(deployRequestExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg);
        if (process.env.UA_ID && msgJSON.visitor) {
            msgJSON.visitor = ua(process.env.UA_ID);
        }
        if (log) {
            logger.debug(`deployQueueCheck: found a msg for ${msgJSON.deployId}`, msgJSON);
        }
        return msgJSON;
    }
    else {
        throw new Error('regular deploy request queue is empty');
    }
};
exports.getDeployRequest = getDeployRequest;
const putDeployRequest = async (depReq, log) => {
    await redis.rpush(deployRequestExchange, JSON.stringify(depReq));
    logger.debug('redis: added to deploy queue', depReq);
};
exports.putDeployRequest = putDeployRequest;
const putPoolRequest = async (poolReq, log) => {
    await redis.rpush(poolDeployExchange, JSON.stringify(poolReq));
};
exports.putPoolRequest = putPoolRequest;
const getPoolRequest = async (log) => {
    const msg = await redis.lpop(poolDeployExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg);
        if (log) {
            logger.debug('poolQueueCheck: found a msg', msgJSON);
        }
        return msgJSON;
    }
    else {
        throw new Error('pool request queue is empty');
    }
};
exports.getPoolRequest = getPoolRequest;
const cdsPublish = async (cds) => {
    await redis.publish(cdsExchange, JSON.stringify(cds));
};
exports.cdsPublish = cdsPublish;
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
exports.getKeys = getKeys;
const getPooledOrg = async (key, log) => {
    const msg = await redis.lpop(key);
    if (msg) {
        const poolOrg = JSON.parse(msg);
        if (log) {
            logger.debug(`pooledOrgFinder: found an org in ${key}`, poolOrg);
        }
        return poolOrg;
    }
    else {
        throw new Error(`no queued orgs for ${key}`);
    }
};
exports.getPooledOrg = getPooledOrg;
const putPooledOrg = async (depReq, poolMessage) => {
    const key = await utilities.getKey(depReq);
    await redis.rpush(key, JSON.stringify(poolMessage));
};
exports.putPooledOrg = putPooledOrg;
const getPoolDeployRequestQueueSize = async () => redis.llen(poolDeployExchange);
exports.getPoolDeployRequestQueueSize = getPoolDeployRequestQueueSize;
const getPoolDeployCountByRepo = async (username, repo) => {
    const poolRequests = await redis.lrange(poolDeployExchange, 0, -1);
    return poolRequests
        .map(pr => JSON.parse(pr))
        .filter((pr) => pr.repo === repo && pr.username === username)
        .length;
};
exports.getPoolDeployCountByRepo = getPoolDeployCountByRepo;
