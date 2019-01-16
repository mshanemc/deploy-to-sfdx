"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const util = require("util");
const child_process_1 = require("child_process");
const utilities = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const poolPrep_1 = require("./poolPrep");
const execProm = util.promisify(child_process_1.exec);
(async () => {
    if (utilities.checkHerokuAPI()) {
        const currentNeed = await redisNormal_1.getPoolDeployRequestQueueSize();
        logger.debug(`starting ${currentNeed} builders for poolQueue`);
        await Promise.all(Array(Math.max(0, currentNeed)).fill(execProm(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`)));
        await poolPrep_1.prepareAll();
    }
})();
