
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/lightning-vf', async () => {
    await deployCheck('mshanemc', 'lightning-vf');
}, sfdxTimeout);     
