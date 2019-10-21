"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const utilities = __importStar(require("./utilities"));
const redisNormal_1 = require("./redisNormal");
const execProm_1 = require("./execProm");
const namedUtilities_1 = require("./namedUtilities");
const universal_analytics_1 = __importDefault(require("universal-analytics"));
exports.preparePoolByName = async (pool, createHerokuDynos = true) => {
    const targetQuantity = pool.quantity;
    const poolname = namedUtilities_1.getPoolName(pool);
    const actualQuantity = await redisNormal_1.redis.llen(poolname);
    if (actualQuantity >= targetQuantity) {
        heroku_logger_1.default.debug(`pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity} and is full.`);
        return;
    }
    if (actualQuantity < targetQuantity) {
        const inFlight = await redisNormal_1.getPoolDeployCountByRepo(pool);
        const needed = targetQuantity - actualQuantity - inFlight;
        heroku_logger_1.default.debug(`pool ${poolname} has ${actualQuantity} ready and ${inFlight} in queue out of ${targetQuantity}...`);
        if (needed <= 0) {
            return;
        }
        const deployId = encodeURIComponent(`${pool.user}-${pool.repo}-${new Date().valueOf()}`);
        const username = poolname.split('.')[0];
        const repo = poolname.split('.')[1];
        const message = {
            pool: true,
            username,
            repo,
            deployId,
            whitelisted: true,
            createdTimestamp: new Date()
        };
        if (process.env.UA_ID) {
            message.visitor = universal_analytics_1.default(process.env.UA_ID);
        }
        if (pool.branch) {
            message.branch = pool.branch;
        }
        const messages = [];
        while (messages.length < needed) {
            messages.push(redisNormal_1.putPoolRequest(message));
        }
        await Promise.all(messages);
        heroku_logger_1.default.debug(`...Requesting ${needed} more org for ${poolname}...`);
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
    heroku_logger_1.default.debug(`preparing ${pools.length} pools`);
    await Promise.all(pools.map(pool => exports.preparePoolByName(pool)));
    heroku_logger_1.default.debug('all pools prepared');
};
