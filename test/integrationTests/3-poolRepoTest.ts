/* globals it, describe, document */
import * as chai from 'chai';
import * as util from 'util';

import * as fs from 'fs-extra';
import * as rmfr from 'rmfr';

import { testRepos } from '../testRepos';
import { deployRequest, testRepo, poolOrg } from '../../src/lib/types';

import { redis } from '../../src/lib/redisNormal';

import { clearQueues } from '../helpers/clearRedis';
import { deployCheck } from '../helpers/deployCheck';

import { preparePoolByName } from '../../src/lib/poolPrep';
import { poolBuild } from '../../src/lib/poolBuild';

const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15;
const tmpDir = 'src/tmp';

const exec = util.promisify(require('child_process').exec);

if (!testEnv) {
  throw new Error(
    'export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]'
  );
}

const requestAddToPool = async (testRepo: testRepo) => {
  // add to pool
  await preparePoolByName(
    {
      user: testRepo.username,
      repo: testRepo.repo,
      quantity: 2,
      lifeHours: 1
    },
    false
  );
  let poolSize = await redis.llen('poolDeploys');
  expect(poolSize).to.equal(2);
  // verify in poolRequests
  const msg = <deployRequest>JSON.parse(await redis.lpop('poolDeploys'));
  poolSize = await redis.llen('poolDeploys');
  expect(poolSize).to.equal(1);

  expect(msg).to.be.an('object');
  expect(msg.username).to.equal(testRepo.username);
  expect(msg.repo).to.equal(testRepo.repo);
  expect(msg.whitelisted).to.equal(true);
  expect(msg.pool).to.equal(true);
};

const requestBuildPool = async (testRepo: testRepo, deleteIt: boolean) => {
  // run poolConsumer
  const built = await poolBuild();
  expect(built).to.equal(true);

  // verify not in poolRequests
  const poolDeploySize = await redis.llen('poolDeploys');
  expect(poolDeploySize).to.equal(0);

  // verify in the pool for that repo
  const repoPoolSize = await redis.llen(
    `${testRepo.username}.${testRepo.repo}`
  );
  expect(repoPoolSize).to.equal(1);

  const poolOrg = <poolOrg>(
    JSON.parse(await redis.lpop(`${testRepo.username}.${testRepo.repo}`))
  );
  expect(poolOrg.repo).to.equal(testRepo.repo);
  expect(poolOrg.githubUsername).to.equal(testRepo.username);
  expect(poolOrg.openCommand).to.be.a('string');
  expect(poolOrg.displayResults.username).to.be.a('string');

  if (deleteIt) {
    // clean up after ourselves by deleting the org
    const deleteResult = await exec(
      `sfdx force:org:delete -p -u ${poolOrg.displayResults.username} --json`
    );
    expect(JSON.parse(deleteResult.stdout).status).to.equal(0);
  }
};

describe('tests that each repo works in a pooled scenario', () => {
  before(async () => {
    await clearQueues();
    await rmfr(tmpDir);
    fs.ensureDirSync(tmpDir);
  });

  for (const prop in testRepos) {
    describe(`tests all the repos under ${prop}`, () => {
      testRepos[prop].forEach((testRepo) => {
        it(`adds ${testRepo.username}/${
          testRepo.repo
        } to the poolDeploys queue`, async () => {
          await requestAddToPool(testRepo);
        });

        it(`builds a pooled org for ${testRepo.username}/${
          testRepo.repo
          }`, async () => {
            await requestBuildPool(testRepo, true);
          })
          .timeout(waitTimeout)
          .retries(2);
      });
    });
  }

  for (const prop in testRepos) {
    describe(`tests all the repos under ${prop}`, () => {
      testRepos[prop].forEach((testRepo) => {
        it(`gets an org from the pool for ${testRepo.username}/${ testRepo.repo }`, async () => {
          await deployCheck(testRepo.username, testRepo.repo);
        });
      });
    });
  }

  after(async () => {
    await clearQueues();
    await rmfr(tmpDir);
  });
});

export {requestAddToPool, requestBuildPool}
