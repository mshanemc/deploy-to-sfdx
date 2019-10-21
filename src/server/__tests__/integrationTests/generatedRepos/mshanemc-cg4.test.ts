
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg4', async () => {
    await deployCheck('mshanemc', 'cg4');
}, sfdxTimeout);     
