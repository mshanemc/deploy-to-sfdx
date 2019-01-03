"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const util = require("util");
const utilities = require("./utilities");
const redis = require("./redisNormal");
const poolPrep_1 = require("./poolPrep");
const exec = util.promisify(require('child_process').exec);
utilities.checkHerokuAPI();
const existingQFlush = async () => {
    const currentNeed = await redis.llen('poolDeploys');
    if (currentNeed > 0) {
        logger.debug(`going to start ${currentNeed} dynos to handle existing poolDeploys`);
        const execs = [];
        for (let x = 0; x < currentNeed; x++) {
            execs.push(exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`));
        }
        await Promise.all(execs);
    }
    else {
        logger.debug('no additional builders needed for poolQueue');
    }
};
existingQFlush()
    .then(async () => {
    await poolPrep_1.prepareAll();
    process.exit(0);
});
