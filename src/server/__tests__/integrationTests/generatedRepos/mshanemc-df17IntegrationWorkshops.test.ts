
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/df17IntegrationWorkshops', async () => {
    await deployCheck('mshanemc', 'df17IntegrationWorkshops');
}, sfdxTimeout);     
