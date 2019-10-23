
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/solutions-engagement/undefined', async () => {
    await deployCheck(testRepo);
}, sfdxTimeout);     
