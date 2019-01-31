"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const util = require("util");
const utilities = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const exec = util.promisify(require('child_process').exec);
exports.preparePoolByName = async (pool, createHerokuDynos = true) => {
    const targetQuantity = pool.quantity;
    const poolname = `${pool.user}.${pool.repo}`;
    const actualQuantity = await redisNormal_1.redis.llen(poolname);
    const messages = [];
    const execs = [];
    if (actualQuantity < targetQuantity) {
        const needed = targetQuantity - actualQuantity;
        logger.debug(`pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity}...`);
        for (let x = 0; x < needed; x++) {
            const username = poolname.split('.')[0];
            const repo = poolname.split('.')[1];
            const deployId = encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}`);
            const message = {
                pool: true,
                username,
                repo,
                deployId,
                whitelisted: true,
                createdTimestamp: new Date()
            };
            if (poolname.split('.')[2]) {
                message.branch = poolname.split('.')[2];
            }
            messages.push(redisNormal_1.putPoolRequest(message));
            if (createHerokuDynos) {
                execs.push(exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`));
            }
        }
        await Promise.all(messages);
        await Promise.all(execs);
        logger.debug(`...Requesting ${needed} more org for ${poolname}...`);
    }
    else {
        logger.debug(`pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity} and is full.`);
    }
};
exports.prepareAll = async () => {
    const pools = await utilities.getPoolConfig();
    logger.debug(`preparing ${pools.length} pools`);
    const prepares = [];
    pools.forEach((pool) => {
        prepares.push(exports.preparePoolByName(pool));
    });
    await Promise.all(prepares);
    logger.debug('all pools prepared');
};
