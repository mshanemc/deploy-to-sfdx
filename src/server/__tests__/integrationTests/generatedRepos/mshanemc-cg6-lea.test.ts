
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/cg6-lea', async () => {
    await deployCheck('mshanemc', 'cg6-lea');
}, sfdxTimeout);     
