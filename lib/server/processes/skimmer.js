"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const utilities_1 = require("../lib/utilities");
const skimmerSupport_1 = require("../lib/skimmerSupport");
const hubAuth_1 = require("../lib/hubAuth");
(async () => {
    await hubAuth_1.auth();
    try {
        if (utilities_1.utilities.checkHerokuAPI()) {
            await skimmerSupport_1.skimmer();
        }
        process.exit(0);
    }
    catch (err) {
        heroku_logger_1.default.error(err);
        process.exit(1);
    }
})();
