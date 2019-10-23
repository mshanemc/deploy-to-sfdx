
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cdc-workshop/no branch', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'cdc-workshop' });
}, sfdxTimeout);     
