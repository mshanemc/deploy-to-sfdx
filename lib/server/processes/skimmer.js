"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const utilities = __importStar(require("../lib/utilities"));
const skimmerSupport_1 = require("../lib/skimmerSupport");
const hubAuth_1 = require("../lib/hubAuth");
(async () => {
    await hubAuth_1.auth();
    try {
        if (utilities.checkHerokuAPI()) {
            await skimmerSupport_1.skimmer();
        }
        process.exit(0);
    }
    catch (err) {
        heroku_logger_1.default.error(err);
        process.exit(1);
    }
})();
