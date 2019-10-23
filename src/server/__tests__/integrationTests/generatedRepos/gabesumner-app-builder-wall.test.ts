
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org gabesumner/app-builder-wall/no branch', async () => {
    await deployCheck({
        username: 'gabesumner',
        repo: 'app-builder-wall' });
}, sfdxTimeout);     
