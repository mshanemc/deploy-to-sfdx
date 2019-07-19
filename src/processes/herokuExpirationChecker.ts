import * as logger from 'heroku-logger';

import { herokuExpirationCheck } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    logger.debug('herokuExpirationCheck started');

    await auth();
    await herokuExpirationCheck();
    process.exit(0);
})();
