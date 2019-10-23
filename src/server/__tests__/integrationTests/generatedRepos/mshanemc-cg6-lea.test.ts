
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg6-lea/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'cg6-lea' });
}, sfdxTimeout);     
