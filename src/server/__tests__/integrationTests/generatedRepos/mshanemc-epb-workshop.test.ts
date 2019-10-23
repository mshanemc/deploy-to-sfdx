
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/epb-workshop/undefined', async () => {
    await deployCheck(testRepo);
}, sfdxTimeout);     
