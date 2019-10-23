
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cpq-workshop/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'cpq-workshop' });
}, sfdxTimeout);     
