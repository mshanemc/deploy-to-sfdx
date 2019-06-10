"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const util = require("util");
const hubAuth_1 = require("../lib/hubAuth");
const checkQueue = require("../lib/deployQueueCheck");
const setTimeoutPromise = util.promisify(setTimeout);
(async () => {
    logger.debug('DeployConsumer: I am a always-on deploy (non-pool) consumer and I am up!');
    await hubAuth_1.auth();
    let processedSomething = true;
    while (true) {
        processedSomething = await checkQueue();
        if (!processedSomething) {
            await setTimeoutPromise(1000);
        }
    }
})();
