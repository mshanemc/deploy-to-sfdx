
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/df17AppBuilding/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'df17AppBuilding' });
}, sfdxTimeout);     
