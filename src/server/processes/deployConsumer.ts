/* eslint-disable no-await-in-loop */
import logger from 'heroku-logger';
import * as util from 'util';
import { auth } from '../lib/hubAuth';
import checkQueue from '../lib/deployQueueCheck';

const setTimeoutPromise = util.promisify(setTimeout);

(async () => {
    logger.debug('DeployConsumer: I am a always-on deploy (non-pool) consumer and I am up!');

    await auth();
    let processedSomething = true;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        processedSomething = await checkQueue();

        // back off a second before checking the queue again if it was empty
        if (!processedSomething) {
            await setTimeoutPromise(1000);
        }
    }
})();
