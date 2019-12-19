/* eslint-disable no-process-exit */
// uses the heroku API to look for one-off dynos that have been up too long (whatever that is defined as)
import Heroku from 'heroku-client';
import logger from 'heroku-logger';
import moment from 'moment';

import { utilities } from '../lib/utilities';
import { HerokuDyno } from '../lib/types';
import { processWrapper } from '../lib/processWrapper';

(async () => {
    // validations that we can process these
    if (!utilities.checkHerokuAPI() || !processWrapper.HEROKU_APP_NAME) {
        logger.error('dynoCleanup cannot run');
        process.exit(1);
    }

    try {
        const heroku = new Heroku({ token: processWrapper.HEROKU_API_KEY });
        const runDynos = (await heroku.get(`/apps/${processWrapper.HEROKU_APP_NAME}/dynos`)) as HerokuDyno[];

        await Promise.all(
            runDynos
                .filter(dyno => dyno.type === 'run')
                .filter(dyno => moment(dyno.created_at).isBefore(moment().subtract(processWrapper.DYNO_TIME_LIMIT, 'minutes')))
                .map(dyno => heroku.post(`/apps/${processWrapper.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`))
        );
    } catch (err) {
        logger.error('dynoCleanup', err);
    }

    process.exit(0);
})();
