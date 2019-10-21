
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/process-automation-workshop-df17', async () => {
    await deployCheck('mshanemc', 'process-automation-workshop-df17');
}, sfdxTimeout);     
