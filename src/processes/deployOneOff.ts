import * as logger from 'heroku-logger';
import * as checkQueue from '../lib/deployQueueCheck';
import { auth } from '../lib/hubAuth';
import { getDeployRequestSize } from '../lib/redisNormal';

(async () => {
    logger.debug('A one-off deploy consumer dyno is up!');
    await auth();

    while ((await getDeployRequestSize()) > 0) {
        await checkQueue();
    }

    process.exit(0);
})();
