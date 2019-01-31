"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require("ioredis");
const logger = require("heroku-logger");
const ua = require("universal-analytics");
const utilities = require("./utilities");
const shellSanitize = require("./shellSanitize");
const cdsExchange = 'deployMsg';
exports.cdsExchange = cdsExchange;
const deployRequestExchange = 'deploys';
exports.deployRequestExchange = deployRequestExchange;
const poolDeployExchange = 'poolDeploys';
const redis = new Redis(process.env.REDIS_URL);
exports.redis = redis;
const deleteOrg = async (username) => {
    if (shellSanitize(username)) {
        const msg = {
            username,
            delete: true
        };
        await redis.publish(poolDeployExchange, JSON.stringify(msg));
    }
    else {
        throw new Error(`invalid username ${username}`);
    }
};
exports.deleteOrg = deleteOrg;
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
    logger.debug('redis: added to deploy queue', putDeployRequest);
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
