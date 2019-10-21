
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/easy-spaces', async () => {
    await deployCheck('mshanemc', 'easy-spaces');
}, sfdxTimeout);     
