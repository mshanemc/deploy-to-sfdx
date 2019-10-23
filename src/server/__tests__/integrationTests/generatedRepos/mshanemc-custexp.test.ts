
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/custexp/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'custexp' });
}, sfdxTimeout);     
