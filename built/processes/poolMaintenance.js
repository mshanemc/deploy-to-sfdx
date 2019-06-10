"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const utilities = require("../lib/utilities");
const redisNormal_1 = require("../lib/redisNormal");
const poolPrep_1 = require("../lib/poolPrep");
const execProm_1 = require("./../lib/execProm");
const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 50;
(async () => {
    if (utilities.checkHerokuAPI()) {
        const currentNeed = Math.min(maxPoolBuilders, await redisNormal_1.getPoolDeployRequestQueueSize());
        if (currentNeed === maxPoolBuilders) {
            logger.warn('the poolDeploys queue seems really large');
        }
        let builders = 0;
        const builderCommand = utilities.getPoolDeployerCommand();
        while (builders < currentNeed) {
            await execProm_1.execProm(builderCommand);
            builders++;
        }
        logger.debug(`stared ${currentNeed} builders for poolQueue`);
        await poolPrep_1.prepareAll();
    }
    process.exit(0);
})();
