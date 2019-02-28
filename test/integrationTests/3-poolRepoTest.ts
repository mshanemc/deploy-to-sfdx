/* globals it, describe, document */
import * as fs from 'fs-extra';

import { testRepos } from '../testRepos';
import { clearQueues } from '../helpers/clearRedis';
import { deployCheck } from '../helpers/deployCheck';
import { requestAddToPool, requestBuildPool } from '../helpers/poolHelpers';

const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15;
const tmpDir = 'src/tmp';

if (!testEnv) {
  throw new Error(
    'export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]'
  );
}

describe('tests that each repo works in a pooled scenario', () => {
  before(async () => {
    await clearQueues();
    await fs.remove(tmpDir);
    fs.ensureDirSync(tmpDir);
  });

  for (const prop in testRepos) {
    describe(`tests all the repos under ${prop}`, () => {
      
      for (const testRepo of testRepos[prop]){
        it(`adds ${testRepo.username}/${ testRepo.repo } to the poolDeploys queue`, async () => {
          await requestAddToPool(testRepo);
        });

        it(`builds a pooled org for ${testRepo.username}/${ testRepo.repo }`, async () => {
            await requestBuildPool(testRepo, false);
          })
          .timeout(waitTimeout)
          .retries(2);
      }
    });
  }

  for (const prop in testRepos) {
    describe(`tests all the repos under ${prop}`, () => {
      for (const testRepo of testRepos[prop]){
        it(`gets an org from the pool for ${testRepo.username}/${ testRepo.repo }`, async () => {
          await deployCheck(testRepo.username, testRepo.repo);
        }).timeout(waitTimeout);
      }
    });
  }

  after(async () => {
    await clearQueues();
    await fs.remove(tmpDir);
  });
});