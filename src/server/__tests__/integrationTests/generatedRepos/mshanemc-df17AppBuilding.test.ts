
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/df17AppBuilding', async () => {
    await deployCheck('mshanemc', 'df17AppBuilding');
}, sfdxTimeout);     
