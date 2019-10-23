
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/volunteering-base-pkg/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'volunteering-base-pkg' });
}, sfdxTimeout);     
