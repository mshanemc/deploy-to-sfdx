"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const utilities_1 = require("../lib/utilities");
const redisNormal_1 = require("../lib/redisNormal");
const poolPrep_1 = require("../lib/poolPrep");
const execProm_1 = require("../lib/execProm");
const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 50;
(async () => {
    if (utilities_1.utilities.checkHerokuAPI()) {
        const currentNeed = Math.min(maxPoolBuilders, await redisNormal_1.getPoolDeployRequestQueueSize());
        if (currentNeed === maxPoolBuilders) {
            heroku_logger_1.default.warn('the poolDeploys queue seems really large');
        }
        let builders = 0;
        const builderCommand = utilities_1.utilities.getPoolDeployerCommand();
        while (builders < currentNeed) {
            await execProm_1.execProm(builderCommand);
            builders++;
        }
        heroku_logger_1.default.debug(`stared ${currentNeed} builders for poolQueue`);
        await poolPrep_1.prepareAll();
    }
    process.exit(0);
})();
