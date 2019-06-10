"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment");
const logger = require("heroku-logger");
const redisNormal_1 = require("./redisNormal");
const utilities = require("./utilities");
const herokuDelete_1 = require("./herokuDelete");
const execProm_1 = require("../lib/execProm");
const skimmer = async () => {
    const pools = await utilities.getPoolConfig();
    const promises = [];
    pools.forEach(pool => {
        promises.push(checkExpiration(pool));
    });
    const results = await Promise.all(promises);
    results.forEach(result => logger.debug(result));
};
exports.skimmer = skimmer;
const checkExpiration = async (pool) => {
    const poolname = `${pool.user}.${pool.repo}`;
    const currentPoolSize = await redisNormal_1.redis.llen(poolname);
    if (currentPoolSize === 0) {
        return `pool ${poolname} is empty`;
    }
    const allMessages = await redisNormal_1.redis.lrange(poolname, 0, -1);
    const allOrgs = allMessages.map(msg => JSON.parse(msg));
    const goodOrgs = allOrgs
        .filter(org => moment().diff(moment(org.completeTimestamp), 'hours', true) <= pool.lifeHours)
        .map(org => JSON.stringify(org));
    if (goodOrgs.length === allMessages.length) {
        return `all the orgs in pool ${poolname} are fine`;
    }
    await redisNormal_1.redis.del(poolname);
    if (goodOrgs.length > 0) {
        logger.debug(`putting ${goodOrgs.length} back in ${poolname}`);
        await redisNormal_1.redis.lpush(poolname, ...goodOrgs);
    }
    const expiredOrgs = allOrgs
        .filter(org => moment().diff(moment(org.completeTimestamp), 'hours', true) > pool.lifeHours
        && org.mainUser
        && org.mainUser.username)
        .map(org => JSON.stringify({ username: org.mainUser.username, delete: true }));
    if (expiredOrgs.length > 0) {
        await redisNormal_1.redis.rpush(redisNormal_1.orgDeleteExchange, ...expiredOrgs);
    }
    return `queueing for deletion ${expiredOrgs.length} expired orgs from pool ${poolname}`;
};
exports.checkExpiration = checkExpiration;
const herokuExpirationCheck = async () => {
    const herokuCDSs = await redisNormal_1.getHerokuCDSs();
    if (herokuCDSs.length > 0) {
        if (!process.env.HEROKU_API_KEY) {
            logger.warn('there is no heroku API key');
        }
        else {
            for (const cds of herokuCDSs) {
                const username = cds.mainUser.username;
                const queryResult = await execProm_1.execProm(`sfdx force:data:soql:query -u hub -q "select status from ScratchOrgInfo where SignupUsername='${username}'" --json`);
                const status = JSON.parse(queryResult.stdout).result.records[0].Status;
                if (status === 'Deleted') {
                    for (const appName of await redisNormal_1.getAppNamesFromHerokuCDSs(cds.mainUser.username)) {
                        await herokuDelete_1.herokuDelete(appName);
                        logger.debug(`deleted heroku app with name ${appName}`);
                    }
                }
            }
        }
    }
};
exports.herokuExpirationCheck = herokuExpirationCheck;
