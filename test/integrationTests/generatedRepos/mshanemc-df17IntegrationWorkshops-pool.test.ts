
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';
import { pooledOrgFinder } from './../../../src/lib/pooledOrgFinder'; 
import { deployRequest } from './../../../src/lib/types';
import { deleteOrg } from './../../../src/lib/redisNormal';

const tr = {
    username: 'mshanemc',
    repo: 'df17IntegrationWorkshops'
};

describe('pool for mshanemc/df17IntegrationWorkshops', () => {
    test('makes a pool org for mshanemc/df17IntegrationWorkshops', async () => {
        const added = await requestAddToPool(tr);
        expect(added).toBe(true);
        const built = await requestBuildPool(tr, true);
        expect(built).toBe(true);
    }, sfdxTimeout);  

    // test('retrieves an org from the pool for mshanemc/df17IntegrationWorkshops', async () => {
    //     const req: deployRequest = {
    //         repo: tr.repo,
    //         username: tr.username,
    //         deployId: 'mshanemc-df17IntegrationWorkshops-pool-1554940512803',
    //         createdTimestamp: new Date(),
    //         whitelisted: true
    //     }
    //     const foundInPool = await pooledOrgFinder(req);
    //     expect(foundInPool).toBeTruthy();
        
    //     // delete the org
    //     await deleteOrg(foundInPool.mainUser.username);
    // }, sfdxTimeout);         
});
