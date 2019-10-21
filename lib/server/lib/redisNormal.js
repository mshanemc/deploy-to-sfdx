"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const universal_analytics_1 = __importDefault(require("universal-analytics"));
const utilities_1 = require("./utilities");
const shellSanitize_1 = require("./shellSanitize");
const CDS_1 = require("./CDS");
const cdsExchange = 'deployMsg';
exports.cdsExchange = cdsExchange;
const deployRequestExchange = 'deploys';
exports.deployRequestExchange = deployRequestExchange;
const poolDeployExchange = 'poolDeploys';
const orgDeleteExchange = 'orgDeletes';
exports.orgDeleteExchange = orgDeleteExchange;
const herokuCDSExchange = 'herokuCDSs';
const days31asSeconds = 31 * 24 * 60 * 60;
const redis = new ioredis_1.default(process.env.REDIS_URL);
exports.redis = redis;
const deleteOrg = async (username) => {
    heroku_logger_1.default.debug(`org delete requested for ${username}`);
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
    const CDSs = (await redis.lrange(herokuCDSExchange, 0, -1)).map(queueItem => JSON.parse(queueItem));
    return CDSs;
};
exports.getHerokuCDSs = getHerokuCDSs;
const getAppNamesFromHerokuCDSs = async (salesforceUsername, expecting = true) => {
    let herokuCDSs = await getHerokuCDSs();
    if (herokuCDSs.length === 0) {
        return [];
    }
    const matchedCDSIndex = herokuCDSs.findIndex(cds => cds.mainUser.username === salesforceUsername);
    if (matchedCDSIndex < 0) {
        if (expecting) {
            heroku_logger_1.default.error(`no heroku CDS found for username ${salesforceUsername}`);
        }
        else {
            heroku_logger_1.default.debug(`no heroku CDS found for username ${salesforceUsername}`);
        }
        return [];
    }
    heroku_logger_1.default.debug(`found matching cds ${salesforceUsername} === ${herokuCDSs[matchedCDSIndex].mainUser.username}`);
    const matched = herokuCDSs.splice(matchedCDSIndex, 1);
    await redis.del(herokuCDSExchange);
    if (herokuCDSs.length > 0) {
        await redis.lpush(herokuCDSExchange, ...herokuCDSs.map(cds => JSON.stringify(cds)));
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
const getDeployRequestSize = async () => {
    return redis.llen(deployRequestExchange);
};
exports.getDeployRequestSize = getDeployRequestSize;
const getDeployRequest = async (log) => {
    const msg = await redis.lpop(deployRequestExchange);
    if (msg) {
        const msgJSON = JSON.parse(msg);
        if (process.env.UA_ID && msgJSON.visitor) {
            msgJSON.visitor = universal_analytics_1.default(process.env.UA_ID);
        }
        if (log) {
            heroku_logger_1.default.debug(`deployQueueCheck: found a msg for ${msgJSON.deployId}`, msgJSON);
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
    heroku_logger_1.default.debug('redis: added to deploy queue', depReq);
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
            heroku_logger_1.default.debug('poolQueueCheck: found a msg', msgJSON);
        }
        return msgJSON;
    }
    else {
        throw new Error('pool request queue is empty');
    }
};
exports.getPoolRequest = getPoolRequest;
const cdsDelete = async (deployId) => {
    const retrieved = await redis.get(deployId);
    if (retrieved) {
        const cds = JSON.parse(retrieved);
        await deleteOrg(cds.mainUser.username);
    }
    await redis.del(deployId);
};
exports.cdsDelete = cdsDelete;
const cdsPublish = async (cds) => {
    if (!cds.isPool) {
        await redis.set(cds.deployId, JSON.stringify(cds), 'EX', days31asSeconds);
    }
};
exports.cdsPublish = cdsPublish;
const cdsRetrieve = async (deployId) => {
    const retrieved = await redis.get(deployId);
    if (retrieved) {
        const cds = JSON.parse(retrieved);
        return cds;
    }
    else {
        heroku_logger_1.default.warn(`No cds results found for deployId ${deployId}`);
        return new CDS_1.CDS({
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
exports.cdsRetrieve = cdsRetrieve;
const getKeysForCDSs = async () => {
    const deployIds = await redis.keys('*-*-*');
    return deployIds.filter(id => !id.includes('.'));
};
exports.getKeysForCDSs = getKeysForCDSs;
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
exports.getKeys = getKeys;
const getPooledOrg = async (key, log) => {
    const msg = await redis.lpop(key);
    if (msg) {
        const poolOrg = JSON.parse(msg);
        if (log) {
            heroku_logger_1.default.debug(`pooledOrgFinder: found an org in ${key}`, poolOrg);
        }
        return poolOrg;
    }
    else {
        throw new Error(`no queued orgs for ${key}`);
    }
};
exports.getPooledOrg = getPooledOrg;
const putPooledOrg = async (depReq, poolMessage) => {
    const key = await utilities_1.utilities.getKey(depReq);
    await redis.rpush(key, JSON.stringify(poolMessage));
};
exports.putPooledOrg = putPooledOrg;
const getPoolDeployRequestQueueSize = async () => redis.llen(poolDeployExchange);
exports.getPoolDeployRequestQueueSize = getPoolDeployRequestQueueSize;
const getPoolDeployCountByRepo = async (pool) => {
    const poolRequests = await redis.lrange(poolDeployExchange, 0, -1);
    return poolRequests
        .map(pr => JSON.parse(pr))
        .filter((pr) => pr.repo === pool.repo && pr.username === pool.user && pr.branch === pool.branch).length;
};
exports.getPoolDeployCountByRepo = getPoolDeployCountByRepo;
