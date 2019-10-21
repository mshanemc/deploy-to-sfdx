
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/flows-simple', async () => {
    await deployCheck('mshanemc', 'flows-simple');
}, sfdxTimeout);     
