
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cdc-workshop', async () => {
    await deployCheck('mshanemc', 'cdc-workshop');
}, sfdxTimeout);     
