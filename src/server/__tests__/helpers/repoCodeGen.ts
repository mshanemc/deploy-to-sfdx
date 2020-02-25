/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import { testRepos } from './testRepos';

const folder = 'src/server/__tests__/integrationTests/generatedRepos';

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

test('non-pool grab of the org ${testRepo.username}/${testRepo.repo}/${testRepo.branch || 'no branch'}', async () => {
    await deployCheck({
        username: '${testRepo.username}',
        repo: '${testRepo.repo}' ${
            testRepo.branch
                ? `,
        branch: '${testRepo.branch}'}`
                : '}'
        });
}, sfdxTimeout);     
`;

        const output2 = `
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';
import { pooledOrgFinder } from './../../../lib/pooledOrgFinder'; 
import { DeployRequest } from './../../../lib/types';
import { cdsDelete } from './../../../lib/redisNormal';

const tr = {
    username: '${testRepo.username}',
    repo: '${testRepo.repo}',
    whitelisted: true
};

describe('pool for ${testRepo.username}/${testRepo.repo}', () => {
        test('makes a pool org for ${testRepo.username}/${testRepo.repo}', async () => {
            const added = await requestAddToPool(tr);
            expect(added).toBe(true);
            const built = await requestBuildPool(tr, true);
            expect(built).toBe(true);
        }, sfdxTimeout);  
    
        test('retrieves an org from the pool for ${testRepo.username}/${testRepo.repo}', async () => {
            const req: DeployRequest = {
                deployId: '${testRepo.username}-${testRepo.repo}-pool-${new Date().valueOf()}',
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
`;
        const filename = testRepo.branch
            ? `${folder}/${testRepo.username}-${testRepo.repo}-${testRepo.branch}.test.ts`
            : `${folder}/${testRepo.username}-${testRepo.repo}.test.ts`;
        await fs.writeFile(filename, output);

        if (testRepo.testPool) {
            await fs.writeFile(`${folder}/${testRepo.username}-${testRepo.repo}-pool.test.ts`, output2);
        }
    }
})();
