
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org mshanemc/solutions-engagement/df19', async () => {
    await deployCheck({
        username: 'mshanemc',
        repo: 'solutions-engagement' ,
        branch: 'df19'});
}, sfdxTimeout);     
