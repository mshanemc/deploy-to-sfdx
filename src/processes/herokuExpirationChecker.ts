import { Logger } from 'heroku-logger';

import { herokuExpirationCheck } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    Logger.debug('herokuExpirationCheck started');

    await auth();
    await herokuExpirationCheck();
    process.exit(0);
})();
