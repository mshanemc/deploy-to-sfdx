import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';

const tr = {
    username: 'mshanemc',
    repo: 'cg1-lowcode'
};

test('non-pool grab of the org mshanemc/cg1-lowcode', async () => {
    await deployCheck('mshanemc', 'cg1-lowcode');
}, sfdxTimeout);    

test('makes a pool org for mshanemc/cg1-lowcode', async () => {
    const added = await requestAddToPool(tr);
    expect(added).toBe(true);
    const built = await requestBuildPool(tr, false);
    expect(built).toBe(true);
}, sfdxTimeout);  

test('retrieves an org from the pool for mshanemc/cg1-lowcode', async () => {
    await deployCheck('mshanemc', 'cg1-lowcode');
}, sfdxTimeout);        
