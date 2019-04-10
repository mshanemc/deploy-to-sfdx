import { preparePoolByName } from '../../src/lib/poolPrep';
import { testRepo, poolOrg } from '../../src/lib/types';
import { redis } from '../../src/lib/redisNormal';
// import utilities = require('../../src/lib/utilities');
import { poolBuild } from '../../src/lib/poolBuild';

import { exec } from '../../src/lib/execProm';

const requestAddToPool = async (testRepo: testRepo, quantity:number = 1) => {
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

  // verify exists in poolRequests
  const allMessages = await redis.lrange('poolDeploys', 0, -1);
  const msg = allMessages.map( msg => JSON.parse(msg)).find( msg => msg.repo === testRepo.repo);

  expect(msg.username).toBe(testRepo.username);
  expect(msg.repo).toBe(testRepo.repo);
  expect(msg.whitelisted).toBe(true);
  expect(msg.pool).toBe(true);
  return true;
};

const requestBuildPool = async (testRepo: testRepo, deleteIt: boolean) => {
  
  const buildResult = await poolBuild();
  expect(buildResult).toBe(true);

  // verify not in poolRequests
  const allMessages = await redis.lrange('poolDeploys', 0, -1);
  const msg = allMessages.map( msg => JSON.parse(msg)).find( msg => msg.repo === testRepo.repo);
  expect(msg).toBeFalsy();

  // verify in the pool for that repo
  const repoPoolSize = await redis.llen(
    `${testRepo.username}.${testRepo.repo}`
  );
  expect(repoPoolSize).toBe(1);

  const poolOrg = <poolOrg>(
    JSON.parse(await redis.lpop(`${testRepo.username}.${testRepo.repo}`))
  );
  expect(poolOrg.repo).toBe(testRepo.repo);
  expect(poolOrg.githubUsername).toBe(testRepo.username);
  expect(typeof poolOrg.openCommand).toBe('string');
  expect(typeof poolOrg.displayResults.username).toBe('string');

  if (deleteIt) {
    // clean up after ourselves by deleting the org
    const deleteResult = await exec(
      `sfdx force:org:delete -p -u ${poolOrg.displayResults.username} --json`
    );
    expect(JSON.parse(deleteResult.stdout).status).toBe(0);
  } else {
    await redis.rpush(`${testRepo.username}.${testRepo.repo}`, JSON.stringify(poolOrg));
  }
  return true;
};

export {requestAddToPool, requestBuildPool}