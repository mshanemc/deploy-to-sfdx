
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cpq-workshop', async () => {
    await deployCheck('mshanemc', 'cpq-workshop');
}, sfdxTimeout);     
