
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/solutions-engagement', async () => {
    await deployCheck('mshanemc', 'solutions-engagement');
}, sfdxTimeout);     
