"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_client_1 = __importDefault(require("heroku-client"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const moment_1 = __importDefault(require("moment"));
const utilities_1 = __importDefault(require("../lib/utilities"));
const dynoTimeLimit = process.env.DYNO_TIME_LIMIT || 30;
(async () => {
    if (!utilities_1.default.checkHerokuAPI() || !process.env.HEROKU_APP_NAME) {
        heroku_logger_1.default.error('dynoCleanup cannot run');
        process.exit(1);
    }
    try {
        const heroku = new heroku_client_1.default({ token: process.env.HEROKU_API_KEY });
        const runDynos = await heroku.get(`/apps/${process.env.HEROKU_APP_NAME}/dynos`);
        await Promise.all(runDynos
            .filter(dyno => dyno.type === 'run')
            .filter(dyno => moment_1.default(dyno.created_at).isBefore(moment_1.default().subtract(dynoTimeLimit, 'minutes')))
            .map(dyno => heroku.post(`/apps/${process.env.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`)));
    }
    catch (err) {
        heroku_logger_1.default.error('dynoCleanup', err);
    }
    process.exit(0);
})();
