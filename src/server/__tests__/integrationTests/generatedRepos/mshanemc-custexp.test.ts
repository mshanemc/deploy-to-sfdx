
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/custexp', async () => {
    await deployCheck('mshanemc', 'custexp');
}, sfdxTimeout);     
