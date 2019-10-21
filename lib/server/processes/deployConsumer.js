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
const util = __importStar(require("util"));
const hubAuth_1 = require("../lib/hubAuth");
const deployQueueCheck_1 = __importDefault(require("../lib/deployQueueCheck"));
const setTimeoutPromise = util.promisify(setTimeout);
(async () => {
    heroku_logger_1.default.debug('DeployConsumer: I am a always-on deploy (non-pool) consumer and I am up!');
    await hubAuth_1.auth();
    let processedSomething = true;
    while (true) {
        processedSomething = await deployQueueCheck_1.default();
        if (!processedSomething) {
            await setTimeoutPromise(1000);
        }
    }
})();
