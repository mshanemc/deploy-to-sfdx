/* eslint-disable no-await-in-loop */
import logger from 'heroku-logger';
import checkQueue from '../lib/deployQueueCheck';
import { auth } from '../lib/hubAuth';
import { getDeployRequestSize } from '../lib/redisNormal';

(async () => {
    logger.debug('A one-off deploy consumer dyno is up!');
    await auth();

    while ((await getDeployRequestSize()) > 0) {
        await checkQueue();
    }

    // eslint-disable-next-line no-process-exit
    process.exit(0);
})();
