
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/lwc-workshop', async () => {
    await deployCheck('mshanemc', 'lwc-workshop');
}, sfdxTimeout);     
