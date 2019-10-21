
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/encryption-demo', async () => {
    await deployCheck('mshanemc', 'encryption-demo');
}, sfdxTimeout);     
