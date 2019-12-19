import logger from 'heroku-logger';

import { processDeleteQueue } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    logger.debug('orgDeleter started');
    await auth();
    await processDeleteQueue();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
})();
