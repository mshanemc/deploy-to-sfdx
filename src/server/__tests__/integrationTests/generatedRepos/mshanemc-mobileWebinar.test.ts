
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/mobileWebinar', async () => {
    await deployCheck('mshanemc', 'mobileWebinar');
}, sfdxTimeout);     
