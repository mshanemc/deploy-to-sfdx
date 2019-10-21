
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg1', async () => {
    await deployCheck('mshanemc', 'cg1');
}, sfdxTimeout);     
