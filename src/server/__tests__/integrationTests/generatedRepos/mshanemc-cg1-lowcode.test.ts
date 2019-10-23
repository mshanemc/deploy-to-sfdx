
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg1-lowcode/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'cg1-lowcode' });
}, sfdxTimeout);     
