/* eslint-disable no-process-exit */
import logger from 'heroku-logger';
import { utilities } from '../lib/utilities';
import { skimmer } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    await auth();
    try {
        if (utilities.checkHerokuAPI()) {
            await skimmer();
        }
        process.exit(0);
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
})();
