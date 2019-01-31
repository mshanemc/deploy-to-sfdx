import * as chai from 'chai';
import * as util from 'util';

import { preparePoolByName } from '../../src/lib/poolPrep';
import { deployRequest, testRepo, poolOrg } from '../../src/lib/types';
import { redis } from '../../src/lib/redisNormal';
import { poolBuild } from '../../src/lib/poolBuild';

const expect = chai.expect;
const exec = util.promisify(require('child_process').exec);


const requestAddToPool = async (testRepo: testRepo, quantity:number = 2) => {
  // add to pool
  await preparePoolByName(
    {
      user: testRepo.username,
      repo: testRepo.repo,
      quantity,
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

  if (process.env.DEPLOYER_TESTING_ENDPOINT.includes('localhost')){
    const built = await poolBuild();
    expect(built).to.equal(true);
  } else {
    // it's in the cloud, ex: 'https://hosted-scratch-dev.herokuapp.com'
    await exec(`heroku run -a ${process.env.DEPLOYER_TESTING_ENDPOINT.replace('https://', '').replace('.herokuapp.com', '')} pooldeployer`);
  }

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
  } else {
    await redis.rpush(`${testRepo.username}.${testRepo.repo}`, JSON.stringify(poolOrg));
  }
};

export {requestAddToPool, requestBuildPool}