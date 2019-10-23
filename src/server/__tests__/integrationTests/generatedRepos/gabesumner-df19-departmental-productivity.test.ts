
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org gabesumner/df19-departmental-productivity/no branch', async () => {
    await deployCheck({
        username: 'gabesumner',
        repo: 'df19-departmental-productivity' });
}, sfdxTimeout);     
