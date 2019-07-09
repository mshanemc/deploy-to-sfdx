import { removeOldDeployIds, herokuExpirationCheck, processDeleteQueue } from '../lib/skimmerSupport';

(async () => {
    Promise.all([processDeleteQueue(), removeOldDeployIds(), herokuExpirationCheck()]);
    process.exit(0);
})();
