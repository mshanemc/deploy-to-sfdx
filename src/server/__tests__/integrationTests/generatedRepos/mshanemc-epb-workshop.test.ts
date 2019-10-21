
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/epb-workshop', async () => {
    await deployCheck('mshanemc', 'epb-workshop');
}, sfdxTimeout);     
