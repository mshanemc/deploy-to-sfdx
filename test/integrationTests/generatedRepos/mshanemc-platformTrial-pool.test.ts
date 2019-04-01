
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';
import { pooledOrgFinder } from './../../../src/lib/pooledOrgFinder'; 
import { deployRequest } from './../../../src/lib/types';
import { deleteOrg } from './../../../src/lib/redisNormal';

const tr = {
    username: 'mshanemc',
    repo: 'platformTrial'
};

describe('pool for mshanemc/platformTrial', () => {
    test('makes a pool org for mshanemc/platformTrial', async () => {
        const added = await requestAddToPool(tr);
        expect(added).toBe(true);
        const built = await requestBuildPool(tr, false);
        expect(built).toBe(true);
    }, sfdxTimeout);  

    test('retrieves an org from the pool for mshanemc/platformTrial', async () => {
        const req: deployRequest = {
            repo: tr.repo,
            username: tr.username,
            deployId: 'mshanemc-platformTrial-pool-1554147026856',
            createdTimestamp: new Date(),
            whitelisted: true
        }
        const foundInPool = await pooledOrgFinder(req);
        expect(foundInPool).toBeTruthy();
        
        // delete the org
        await deleteOrg(foundInPool.mainUser.username);
    }, sfdxTimeout);         
});
