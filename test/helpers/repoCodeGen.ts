import * as fs from 'fs-extra';
import { testRepos } from '../testRepos';

const folder = 'test/integrationTests/generatedRepos';

( async () => {
    await fs.emptyDir(folder);

    let flatRepos = [];
    Object.keys(testRepos).forEach( key => {
        flatRepos = [...flatRepos, ...testRepos[key]];
    });
    
    for (const testRepo of flatRepos) {
        const output = `
import { deployCheck } from './../../helpers/deployCheck';
import { sfdxTimeout } from './../../helpers/testingUtils';
import { requestAddToPool, requestBuildPool } from './../../helpers/poolHelpers';

const tr = {
    username: '${testRepo.username}',
    repo: '${testRepo.repo}'
};

test('non-pool grab of the org ${testRepo.username}/${testRepo.repo}', async () => {
    await deployCheck('${testRepo.username}', '${testRepo.repo}');
}, sfdxTimeout);    

test('makes a pool org for ${testRepo.username}/${testRepo.repo}', async () => {
    const added = await requestAddToPool(tr);
    expect(added).toBe(true);
    const built = await requestBuildPool(tr, false);
    expect(built).toBe(true);
}, sfdxTimeout);  

test('retrieves an org from the pool for ${testRepo.username}/${testRepo.repo}', async () => {
    await deployCheck('${testRepo.username}', '${testRepo.repo}');
}, sfdxTimeout);        
`;
        await fs.writeFile(`${folder}/${testRepo.username}-${testRepo.repo}.test.ts`, output);
    };

})();