"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const skimmerSupport_1 = require("../lib/skimmerSupport");
const hubAuth_1 = require("../lib/hubAuth");
(async () => {
    heroku_logger_1.default.debug('herokuExpirationCheck started');
    await hubAuth_1.auth();
    await skimmerSupport_1.herokuExpirationCheck();
    process.exit(0);
})();
