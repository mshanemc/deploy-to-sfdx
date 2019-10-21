
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg4Integrate', async () => {
    await deployCheck('mshanemc', 'cg4Integrate');
}, sfdxTimeout);     
