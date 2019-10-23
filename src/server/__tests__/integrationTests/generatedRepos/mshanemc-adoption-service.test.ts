
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/adoption-service/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'adoption-service' });
}, sfdxTimeout);     
