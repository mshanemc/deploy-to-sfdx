"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const checkQueue = require("./deployQueueCheck");
const hubAuth_1 = require("./hubAuth");
(async () => {
    logger.debug('A one-off deploy consumer dyno is up!');
    await hubAuth_1.auth();
    await checkQueue();
})();
