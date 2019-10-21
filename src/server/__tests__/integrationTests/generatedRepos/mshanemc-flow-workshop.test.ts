
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/flow-workshop', async () => {
    await deployCheck('mshanemc', 'flow-workshop');
}, sfdxTimeout);     
