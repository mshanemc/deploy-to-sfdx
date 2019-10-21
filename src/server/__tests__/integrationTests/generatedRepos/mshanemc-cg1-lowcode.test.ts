
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg1-lowcode', async () => {
    await deployCheck('mshanemc', 'cg1-lowcode');
}, sfdxTimeout);     
