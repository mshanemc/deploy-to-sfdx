
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/platformTrial', async () => {
    await deployCheck('mshanemc', 'platformTrial');
}, sfdxTimeout);     
