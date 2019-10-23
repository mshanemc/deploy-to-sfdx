
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org gabesumner/df19-departmental-productivity/undefined', async () => {
    await deployCheck(testRepo);
}, sfdxTimeout);     
