
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/easy-spaces/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'easy-spaces' });
}, sfdxTimeout);     
