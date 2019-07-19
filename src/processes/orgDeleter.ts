import * as logger from 'heroku-logger';

import { processDeleteQueue } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    logger.debug('orgDeleter started');
    await auth();
    await processDeleteQueue();
    process.exit(0);
})();
