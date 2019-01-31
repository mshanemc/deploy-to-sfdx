"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const moment = require("moment");
const request = require("request-promise-native");
const util = require("util");
const redisNormal_1 = require("./redisNormal");
const utilities = require("./utilities");
const exec = util.promisify(require('child_process').exec);
const checkExpiration = async (pool) => {
    const poolname = `${pool.user}.${pool.repo}`;
    const poolOrg = await redisNormal_1.redis.lpop(poolname);
    if (!poolOrg) {
        return `pool ${poolname} is empty`;
    }
    const msgJSON = JSON.parse(poolOrg);
    if (moment().diff(moment(msgJSON.createdDate)) >
        pool.lifeHours * 60 * 60 * 1000) {
        if (msgJSON.displayResults && msgJSON.displayResults.username) {
            await redisNormal_1.redis.rpush('poolDeploys', JSON.stringify({
                username: msgJSON.displayResults.username,
                delete: true
            }));
        }
        else {
            logger.warn('pool org did not have a username', msgJSON);
        }
        await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);
        return `removed an expired org from pool ${poolname}`;
    }
    else {
        await redisNormal_1.redis.lpush(poolname, JSON.stringify(msgJSON));
        return `all the orgs in pool ${poolname} are fine`;
    }
};
const skimmer = async () => {
    const pools = await utilities.getPoolConfig();
    const promises = [];
    pools.forEach((pool) => {
        promises.push(checkExpiration(pool));
    });
    const results = await Promise.all(promises);
    results.forEach(result => logger.debug(result));
};
const herokuExpirationCheck = async () => {
    const herokuDeletes = await redisNormal_1.redis.lrange('herokuDeletes', 0, -1);
    await redisNormal_1.redis.del('herokuDeletes');
    if (herokuDeletes.length > 0) {
        if (!process.env.HEROKU_API_KEY) {
            logger.warn('there is no heroku API key');
        }
        else {
            const execs = [];
            const headers = {
                Accept: 'application/vnd.heroku+json; version=3',
                Authorization: `Bearer ${process.env.HEROKU_API_KEY}`
            };
            herokuDeletes.forEach((raw) => {
                const herokuDelete = JSON.parse(raw);
                if (moment(herokuDelete.expiration).isBefore(moment())) {
                    logger.debug(`deleting heroku app: ${herokuDelete.appName}`);
                    execs.push(request.delete({
                        url: `https://api.heroku.com/apps/${herokuDelete.appName}`,
                        headers,
                        json: true
                    }));
                }
                else {
                    execs.push(redisNormal_1.redis.rpush('herokuDeletes', JSON.stringify(herokuDelete)));
                }
            });
            const results = await Promise.all(execs);
            results.forEach(result => logger.debug(result));
        }
    }
};
(async () => {
    try {
        if (utilities.checkHerokuAPI()) {
            await Promise.all([skimmer(), herokuExpirationCheck()]);
        }
        process.exit(0);
    }
    catch (err) {
        logger.error(err);
        process.exit(1);
    }
})();
