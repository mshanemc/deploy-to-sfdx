
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org gabesumner/solutions-departmental-apps/undefined', async () => {
    await deployCheck(testRepo);
}, sfdxTimeout);     
