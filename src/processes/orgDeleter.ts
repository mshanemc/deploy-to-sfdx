import { Logger } from 'heroku-logger';

import { processDeleteQueue } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    Logger.debug('orgDeleter started');
    await auth();
    await processDeleteQueue();
    process.exit(0);
})();
