"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const utilities = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const execProm_1 = require("../lib/execProm");
const ua = require("universal-analytics");
exports.preparePoolByName = async (pool, createHerokuDynos = true) => {
    const targetQuantity = pool.quantity;
    const poolname = `${pool.user}.${pool.repo}`;
    const actualQuantity = await redisNormal_1.redis.llen(poolname);
    if (actualQuantity >= targetQuantity) {
        logger.debug(`pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity} and is full.`);
        return;
    }
    if (actualQuantity < targetQuantity) {
        const inFlight = await redisNormal_1.getPoolDeployCountByRepo(pool.user, pool.repo);
        const needed = targetQuantity - actualQuantity - inFlight;
        logger.debug(`pool ${poolname} has ${actualQuantity} ready and ${inFlight} in queue out of ${targetQuantity}...`);
        if (needed <= 0) {
            return;
        }
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
        if (process.env.UA_ID) {
            message.visitor = ua(process.env.UA_ID);
        }
        if (poolname.split('.')[2]) {
            message.branch = poolname.split('.')[2];
        }
        const messages = [];
        while (messages.length < needed) {
            messages.push(redisNormal_1.putPoolRequest(message));
        }
        await Promise.all(messages);
        logger.debug(`...Requesting ${needed} more org for ${poolname}...`);
        let builders = 0;
        const builderCommand = utilities.getPoolDeployerCommand();
        if (createHerokuDynos) {
            while (builders < needed && builders < 50) {
                await execProm_1.execProm(builderCommand);
                builders++;
            }
        }
    }
};
exports.prepareAll = async () => {
    const pools = await utilities.getPoolConfig();
    logger.debug(`preparing ${pools.length} pools`);
    await Promise.all(pools.map(pool => exports.preparePoolByName(pool)));
    logger.debug('all pools prepared');
};
