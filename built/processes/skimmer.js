"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const utilities = require("../lib/utilities");
const skimmerSupport_1 = require("../lib/skimmerSupport");
(async () => {
    try {
        if (utilities.checkHerokuAPI()) {
            await Promise.all([skimmerSupport_1.skimmer(), skimmerSupport_1.herokuExpirationCheck()]);
        }
        process.exit(0);
    }
    catch (err) {
        logger.error(err);
        process.exit(1);
    }
})();
