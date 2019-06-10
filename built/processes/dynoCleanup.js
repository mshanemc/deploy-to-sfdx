"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Heroku = require("heroku-client");
const logger = require("heroku-logger");
const moment = require("moment");
const utilities = require("../lib/utilities");
(async () => {
    if (!utilities.checkHerokuAPI() || !process.env.HEROKU_APP_NAME) {
        logger.error('dynoCleanup cannot run');
        process.exit(1);
    }
    try {
        const heroku = new Heroku({ token: process.env.HEROKU_API_KEY });
        const runDynos = await heroku.get(`/apps/${process.env.HEROKU_APP_NAME}/dynos`);
        await Promise.all(runDynos
            .filter(dyno => dyno.type === 'run')
            .filter(dyno => moment(dyno.created_at).isBefore(moment().subtract(20, 'minutes')))
            .map(dyno => heroku.post(`/apps/${process.env.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`)));
    }
    catch (err) {
        logger.error('dynoCleanup', err);
    }
    process.exit(0);
})();
