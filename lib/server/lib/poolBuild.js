"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const hubAuth_1 = require("./hubAuth");
const redisNormal_1 = require("./redisNormal");
const commonBuild_1 = require("./commonBuild");
async function poolBuild() {
    let msgJSON;
    try {
        msgJSON = await redisNormal_1.getPoolRequest(true);
    }
    catch (e) {
        if (e.message === 'pool request queue is empty') {
            heroku_logger_1.default.warn(`failed to build pool: ${e.message}`);
        }
        else {
            heroku_logger_1.default.error(`failed to build pool: ${e.message}`);
        }
        return false;
    }
    await hubAuth_1.auth();
    heroku_logger_1.default.debug('building a pool org!', msgJSON);
    const buildResult = await commonBuild_1.build(msgJSON);
    buildResult.poolBuildStartTime = buildResult.buildStartTime;
    buildResult.poolBuildFinishTime = new Date();
    await redisNormal_1.putPooledOrg(msgJSON, buildResult);
    return true;
}
exports.poolBuild = poolBuild;
