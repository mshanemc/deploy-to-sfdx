import { Logger } from 'heroku-logger';
import { removeOldDeployIds } from '../lib/skimmerSupport';
// import { auth } from '../lib/hubAuth';

(async () => {
    // await auth();
    Logger.debug('removeOldDeployIds started');

    await removeOldDeployIds();
    process.exit(0);
})();
