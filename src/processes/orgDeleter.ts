import { removeOldDeployIds, herokuExpirationCheck, processDeleteQueue } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    await auth();
    await herokuExpirationCheck();
    await removeOldDeployIds();
    await processDeleteQueue();
    process.exit(0);
})();
