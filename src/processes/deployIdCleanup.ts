import { removeOldDeployIds } from '../lib/skimmerSupport';
// import { auth } from '../lib/hubAuth';

(async () => {
    // await auth();
    await removeOldDeployIds();
    process.exit(0);
})();
