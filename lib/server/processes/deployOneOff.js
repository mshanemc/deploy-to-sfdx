"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const deployQueueCheck_1 = __importDefault(require("../lib/deployQueueCheck"));
const hubAuth_1 = require("../lib/hubAuth");
const redisNormal_1 = require("../lib/redisNormal");
(async () => {
    heroku_logger_1.default.debug('A one-off deploy consumer dyno is up!');
    await hubAuth_1.auth();
    while ((await redisNormal_1.getDeployRequestSize()) > 0) {
        await deployQueueCheck_1.default();
    }
    process.exit(0);
})();
