
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/reporting-workshop', async () => {
    await deployCheck('mshanemc', 'reporting-workshop');
}, sfdxTimeout);     
