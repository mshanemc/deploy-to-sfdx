
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';
import { pooledOrgFinder } from './../../../lib/pooledOrgFinder'; 
import { DeployRequest } from './../../../lib/types';
import { cdsDelete } from './../../../lib/redisNormal';

const tr = {
    username: 'mshanemc',
    repo: 'df17IntegrationWorkshops',
    whitelisted: true
};

describe('pool for mshanemc/df17IntegrationWorkshops', () => {
        test('makes a pool org for mshanemc/df17IntegrationWorkshops', async () => {
            const added = await requestAddToPool(tr);
            expect(added).toBe(true);
            const built = await requestBuildPool(tr, true);
            expect(built).toBe(true);
        }, sfdxTimeout);  
    
        test('retrieves an org from the pool for mshanemc/df17IntegrationWorkshops', async () => {
            const req: DeployRequest = {
                deployId: 'mshanemc-df17IntegrationWorkshops-pool-1579902269369',
                createdTimestamp: new Date(),
                repos: [{
                    whitelisted: true,
                    username: tr.username,
                    repo: tr.repo,
                }]
            }
            const foundInPool = await pooledOrgFinder(req, true);
            expect(foundInPool).toBeTruthy();
            
            // delete the org
            await cdsDelete(foundInPool.deployId);
        }, sfdxTimeout);       
        
});
