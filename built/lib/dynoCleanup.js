"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Heroku = require("heroku-client");
const logger = require("heroku-logger");
const moment = require("moment");
const utilities = require("./utilities");
utilities.checkHerokuAPI();
const heroku = new Heroku({ token: process.env.HEROKU_API_KEY });
const commands = [];
const stopOldDynos = async () => {
    const runDynos = await heroku.get(`/apps/${process.env.HEROKU_APP_NAME}/dynos`);
    runDynos.forEach((dyno) => {
        if (dyno.type === 'run' && moment(dyno.created_at).isBefore(moment().subtract(20, 'minutes'))) {
            logger.debug(`stopping a run dyno started at ${dyno.created_at} with command ${dyno.command}`);
            commands.push(heroku.post(`/apps/${process.env.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`));
        }
        else if (dyno.type === 'run') {
            logger.debug(`dyno is fairly recent ${dyno.created_at}`);
        }
    });
    logger.debug(`stopping ${commands.length} run dynos`);
    await Promise.all(commands);
};
stopOldDynos()
    .then(() => {
    process.exit(0);
})
    .catch((err) => {
    logger.error(err);
    process.exit(1);
});
