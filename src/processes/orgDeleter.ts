import { removeOldDeployIds, herokuExpirationCheck, processDeleteQueue } from '../lib/skimmerSupport';

(async () => {
    await herokuExpirationCheck();
    await removeOldDeployIds();
    await processDeleteQueue();
    process.exit(0);
})();
