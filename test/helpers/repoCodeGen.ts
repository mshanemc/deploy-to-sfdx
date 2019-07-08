import * as fs from 'fs-extra';
import { testRepos } from '../testRepos';

const folder = 'test/integrationTests/generatedRepos';

(async () => {
    await fs.emptyDir(folder);

    let flatRepos = [];
    Object.keys(testRepos).forEach(key => {
        flatRepos = [...flatRepos, ...testRepos[key]];
    });

    for (const testRepo of flatRepos) {
        const output = `
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';

test('non-pool grab of the org ${testRepo.username}/${testRepo.repo}', async () => {
    await deployCheck('${testRepo.username}', '${testRepo.repo}');
}, sfdxTimeout);     
`;

        const output2 = `
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';
import { pooledOrgFinder } from './../../../src/lib/pooledOrgFinder'; 
import { deployRequest } from './../../../src/lib/types';
import { cdsDelete } from './../../../src/lib/redisNormal';

const tr = {
    username: '${testRepo.username}',
    repo: '${testRepo.repo}'
};

describe('pool for ${testRepo.username}/${testRepo.repo}', () => {
        test('makes a pool org for ${testRepo.username}/${testRepo.repo}', async () => {
            const added = await requestAddToPool(tr);
            expect(added).toBe(true);
            const built = await requestBuildPool(tr, true);
            expect(built).toBe(true);
        }, sfdxTimeout);  
    
        test('retrieves an org from the pool for ${testRepo.username}/${testRepo.repo}', async () => {
            const req: deployRequest = {
                repo: tr.repo,
                username: tr.username,
                deployId: '${testRepo.username}-${testRepo.repo}-pool-${new Date().valueOf()}',
                createdTimestamp: new Date(),
                whitelisted: true
            }
            const foundInPool = await pooledOrgFinder(req, true);
            expect(foundInPool).toBeTruthy();
            
            // delete the org
            await cdsDelete(foundInPool.deployId);
        }, sfdxTimeout);       
        
});
`;
        await fs.writeFile(`${folder}/${testRepo.username}-${testRepo.repo}.test.ts`, output);

        if (testRepo.testPool) {
            await fs.writeFile(`${folder}/${testRepo.username}-${testRepo.repo}-pool.test.ts`, output2);
        }
    }
})();
