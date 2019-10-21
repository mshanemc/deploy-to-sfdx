
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/adoption-sales', async () => {
    await deployCheck('mshanemc', 'adoption-sales');
}, sfdxTimeout);     
