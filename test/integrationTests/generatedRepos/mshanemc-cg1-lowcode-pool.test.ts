
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';
import { pooledOrgFinder } from './../../../src/lib/pooledOrgFinder'; 
import { deployRequest } from './../../../src/lib/types';
import { deleteOrg } from './../../../src/lib/redisNormal';

const tr = {
    username: 'mshanemc',
    repo: 'cg1-lowcode'
};

describe('pool for mshanemc/cg1-lowcode', () => {
    test('makes a pool org for mshanemc/cg1-lowcode', async () => {
        const added = await requestAddToPool(tr);
        expect(added).toBe(true);
        const built = await requestBuildPool(tr, false);
        expect(built).toBe(true);
    }, sfdxTimeout);  

    test('retrieves an org from the pool for mshanemc/cg1-lowcode', async () => {
        const req: deployRequest = {
            repo: tr.repo,
            username: tr.username,
            deployId: 'mshanemc-cg1-lowcode-pool-1554147026856',
            createdTimestamp: new Date(),
            whitelisted: true
        }
        const foundInPool = await pooledOrgFinder(req);
        expect(foundInPool).toBeTruthy();
        
        // delete the org
        await deleteOrg(foundInPool.mainUser.username);
    }, sfdxTimeout);         
});
