"use strict";
const logger = require("heroku-logger");
const redisNormal_1 = require("./redisNormal");
const pooledOrgFinder_1 = require("./pooledOrgFinder");
const commonBuild_1 = require("./commonBuild");
const check = async () => {
    let msgJSON;
    try {
        msgJSON = await redisNormal_1.getDeployRequest(true);
    }
    catch (e) {
        return false;
    }
    try {
        msgJSON.visitor.event('Deploy Request', msgJSON.template).send();
    }
    catch (e) {
        logger.warn('failed to send GA event');
    }
    if (await pooledOrgFinder_1.pooledOrgFinder(msgJSON)) {
        logger.debug('deployQueueCheck: using a pooled org');
    }
    else {
        await commonBuild_1.build(msgJSON);
    }
    return true;
};
module.exports = check;
