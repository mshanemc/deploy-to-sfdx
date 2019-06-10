"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const checkQueue = require("../lib/deployQueueCheck");
const hubAuth_1 = require("../lib/hubAuth");
(async () => {
    logger.debug('A one-off deploy consumer dyno is up!');
    await hubAuth_1.auth();
    await checkQueue();
    process.exit(0);
})();
