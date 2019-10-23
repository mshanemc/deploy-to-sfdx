
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/process-automation-workshop-df17/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'process-automation-workshop-df17' });
}, sfdxTimeout);     
