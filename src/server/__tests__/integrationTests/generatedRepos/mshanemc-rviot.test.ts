
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/rviot', async () => {
    await deployCheck('mshanemc', 'rviot');
}, sfdxTimeout);     
