import { removeOldDeployIds, herokuExpirationCheck, processDeleteQueue } from '../lib/skimmerSupport';

(async () => {
    await Promise.all([processDeleteQueue(), removeOldDeployIds(), herokuExpirationCheck()]);
    process.exit(0);
})();
