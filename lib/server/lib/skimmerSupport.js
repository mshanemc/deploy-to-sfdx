"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const attempt_1 = require("@lifeomic/attempt");
const redisNormal_1 = require("./redisNormal");
const utilities_1 = require("./utilities");
const herokuDelete_1 = require("./herokuDelete");
const hubAuth_1 = require("./hubAuth");
const execProm_1 = require("./execProm");
const namedUtilities_1 = require("./namedUtilities");
const skimmer = async () => {
    const pools = await utilities_1.utilities.getPoolConfig();
    const promises = [];
    pools.forEach(pool => {
        promises.push(checkExpiration(pool));
    });
    const results = await Promise.all(promises);
    results.forEach(result => heroku_logger_1.default.debug(result));
};
exports.skimmer = skimmer;
const checkExpiration = async (pool) => {
    const poolname = namedUtilities_1.getPoolName(pool);
    const currentPoolSize = await redisNormal_1.redis.llen(poolname);
    if (currentPoolSize === 0) {
        return `pool ${poolname} is empty`;
    }
    const allMessages = await redisNormal_1.redis.lrange(poolname, 0, -1);
    const allOrgs = allMessages.map(msg => JSON.parse(msg));
    const goodOrgs = allOrgs
        .filter(org => moment_1.default().diff(moment_1.default(org.completeTimestamp), 'hours', true) <= pool.lifeHours)
        .map(org => JSON.stringify(org));
    if (goodOrgs.length === allMessages.length) {
        return `all the orgs in pool ${poolname} are fine`;
    }
    await redisNormal_1.redis.del(poolname);
    if (goodOrgs.length > 0) {
        heroku_logger_1.default.debug(`putting ${goodOrgs.length} back in ${poolname}`);
        await redisNormal_1.redis.lpush(poolname, ...goodOrgs);
    }
    const expiredOrgs = allOrgs
        .filter(org => moment_1.default().diff(moment_1.default(org.completeTimestamp), 'hours', true) > pool.lifeHours && org.mainUser && org.mainUser.username)
        .map(org => JSON.stringify({ username: org.mainUser.username, delete: true }));
    if (expiredOrgs.length > 0) {
        await redisNormal_1.redis.rpush(redisNormal_1.orgDeleteExchange, ...expiredOrgs);
    }
    return `queueing for deletion ${expiredOrgs.length} expired orgs from pool ${poolname}`;
};
exports.checkExpiration = checkExpiration;
const doesOrgExist = async (username) => {
    try {
        const queryResult = await execProm_1.exec2JSON(`sfdx force:data:soql:query -u ${process.env.HUB_USERNAME} -q "select status from ScratchOrgInfo where SignupUsername='${username}'" --json`);
        const status = queryResult.result.records[0].Status;
        if (status === 'Deleted' || status === 'Error') {
            return false;
        }
        else {
            return true;
        }
    }
    catch (e) {
        heroku_logger_1.default.error(`error checking hub for username ${username}`);
        heroku_logger_1.default.error(e);
        return false;
    }
};
const herokuExpirationCheck = async () => {
    const herokuCDSs = await redisNormal_1.getHerokuCDSs();
    if (herokuCDSs.length > 0) {
        if (!process.env.HEROKU_API_KEY) {
            heroku_logger_1.default.warn('there is no heroku API key');
        }
        else {
            for (const cds of herokuCDSs) {
                const exists = await doesOrgExist(cds.mainUser.username);
                if (!exists) {
                    for (const appName of await redisNormal_1.getAppNamesFromHerokuCDSs(cds.mainUser.username)) {
                        await herokuDelete_1.herokuDelete(appName);
                        heroku_logger_1.default.debug(`deleted heroku app with name ${appName}`);
                    }
                }
            }
        }
    }
};
exports.herokuExpirationCheck = herokuExpirationCheck;
const removeOldDeployIds = async () => {
    const deployIds = await redisNormal_1.getKeysForCDSs();
    for (const deployId of deployIds) {
        const cds = await redisNormal_1.cdsRetrieve(deployId);
        if (moment_1.default().isAfter(moment_1.default(cds.expirationDate).endOf('day'))) {
            await redisNormal_1.cdsDelete(deployId);
        }
    }
};
exports.removeOldDeployIds = removeOldDeployIds;
const processDeleteQueue = async () => {
    const delQueueInitialSize = await redisNormal_1.getDeleteQueueSize();
    const retryOptions = { maxAttempts: 3, delay: 5000 };
    if (delQueueInitialSize > 0) {
        heroku_logger_1.default.debug(`deleting ${delQueueInitialSize} orgs`);
        try {
            while ((await redisNormal_1.getDeleteQueueSize()) > 0) {
                const deleteReq = await redisNormal_1.getDeleteRequest();
                heroku_logger_1.default.debug(`deleting org with username ${deleteReq.username}`);
                const exists = await doesOrgExist(deleteReq.username);
                if (exists) {
                    try {
                        await attempt_1.retry(async (context) => execProm_1.execProm(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${deleteReq.username} --jwtkeyfile ${await hubAuth_1.getKeypath()} --instanceurl https://test.salesforce.com -s`), retryOptions);
                        await execProm_1.execProm(`sfdx force:org:delete -p -u ${deleteReq.username}`);
                    }
                    catch (e) {
                        heroku_logger_1.default.error(e);
                        heroku_logger_1.default.warn(`unable to delete org with username: ${deleteReq.username}`);
                    }
                }
                else {
                    heroku_logger_1.default.debug(`org with username ${deleteReq.username} is already deleted`);
                }
                for (const appName of await redisNormal_1.getAppNamesFromHerokuCDSs(deleteReq.username, false)) {
                    try {
                        await herokuDelete_1.herokuDelete(appName);
                    }
                    catch (e) {
                        heroku_logger_1.default.error(e);
                    }
                    heroku_logger_1.default.debug(`deleted heroku app with name ${appName}`);
                }
            }
        }
        catch (e) {
            heroku_logger_1.default.error(e);
        }
    }
    else {
        heroku_logger_1.default.debug('no orgs to delete');
    }
};
exports.processDeleteQueue = processDeleteQueue;
