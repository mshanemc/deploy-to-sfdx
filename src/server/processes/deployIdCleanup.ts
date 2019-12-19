/* eslint-disable no-process-exit */
import logger from 'heroku-logger';
import { removeOldDeployIds } from '../lib/skimmerSupport';
// import { auth } from '../lib/hubAuth';

(async () => {
    // await auth();
    logger.debug('removeOldDeployIds started');

    await removeOldDeployIds();
    process.exit(0);
})();
