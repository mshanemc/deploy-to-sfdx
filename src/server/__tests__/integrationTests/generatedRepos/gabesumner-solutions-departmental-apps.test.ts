
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org gabesumner/solutions-departmental-apps', async () => {
    await deployCheck('gabesumner', 'solutions-departmental-apps');
}, sfdxTimeout);     
