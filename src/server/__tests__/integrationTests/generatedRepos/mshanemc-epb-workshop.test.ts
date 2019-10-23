
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/epb-workshop/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'epb-workshop' });
}, sfdxTimeout);     
