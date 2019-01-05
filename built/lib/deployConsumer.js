"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const util = require("util");
const hubAuth = require("./hubAuth");
const checkQueue = require("./deployQueueCheck");
const setTimeoutPromise = util.promisify(setTimeout);
logger.debug('I am a deploy (non-pool) consumer and I am up!');
async function runTheLoop() {
    const processedSomething = await checkQueue();
    if (!processedSomething) {
        await setTimeoutPromise(1000);
    }
    runTheLoop();
}
hubAuth()
    .then(() => runTheLoop());
