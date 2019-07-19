import { herokuExpirationCheck } from '../lib/skimmerSupport';
import { auth } from '../lib/hubAuth';

(async () => {
    await auth();
    await herokuExpirationCheck();
    process.exit(0);
})();
