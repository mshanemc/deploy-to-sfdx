"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
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
            logger.warn(`failed to build pool: ${e.message}`);
        }
        else {
            logger.error(`failed to build pool: ${e.message}`);
        }
        return false;
    }
    await hubAuth_1.auth();
    logger.debug('building a pool org!', msgJSON);
    const buildResult = await commonBuild_1.build(msgJSON);
    await redisNormal_1.putPooledOrg(msgJSON, buildResult);
    return true;
}
exports.poolBuild = poolBuild;
