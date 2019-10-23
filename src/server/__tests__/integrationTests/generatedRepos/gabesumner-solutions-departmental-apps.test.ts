
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org gabesumner/solutions-departmental-apps/no branch', async () => {
    await deployCheck({
        username: 'gabesumner',
        repo: 'solutions-departmental-apps' });
}, sfdxTimeout);     
