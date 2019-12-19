import logger from 'heroku-logger';

import { herokuExpirationCheck } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    logger.debug('herokuExpirationCheck started');

    await auth();
    await herokuExpirationCheck();
    // eslint-disable-next-line no-process-exit
    process.exit(0);
})();
