import { preparePoolByName } from '../../src/lib/poolPrep';
import { testRepo, clientDataStructure } from '../../src/lib/types';
import { redis } from '../../src/lib/redisNormal';
// import utilities = require('../../src/lib/utilities');
import { poolBuild } from '../../src/lib/poolBuild';
import { getKeypath } from '../../src/lib/hubAuth';
import { exec } from '../../src/lib/execProm';
import { retry } from '@lifeomic/attempt';

const retryOptions = { maxAttempts: 60, delay: 5000 };
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

const requestBuildPool = async (testRepo: testRepo, requireAuthable?: boolean) => {
  
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

  const poolOrg = <clientDataStructure>(
    JSON.parse(await redis.lpop(`${testRepo.username}.${testRepo.repo}`))
  );
  expect(poolOrg.deployId).toContain(testRepo.repo);
  expect(poolOrg.deployId).toContain(testRepo.username);
  expect(typeof poolOrg.poolLines.openLine).toBe('string');
  expect(typeof poolOrg.instanceUrl).toBe('string');
  expect(typeof poolOrg.mainUser.username).toBe('string');

  if (requireAuthable) {     
    try {
      // we do this several times to increase the odds of the pool actually working...the first ones to get through sometimes doesn't hit on the findPooledOrg, but many times seems to be pretty sure.
      // it's still flappy sometimes, though
      await retry( 
        async context => exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ poolOrg.mainUser.username } --jwtkeyfile ${ await getKeypath()} --instanceurl https://test.salesforce.com -s`), 
        retryOptions
      );

      await retry( 
        async context => exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ poolOrg.mainUser.username } --jwtkeyfile ${ await getKeypath()} --instanceurl https://test.salesforce.com -s`), 
        retryOptions
      );

      await retry( 
        async context => exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ poolOrg.mainUser.username } --jwtkeyfile ${ await getKeypath()} --instanceurl https://test.salesforce.com -s`), 
        retryOptions
      );

      await retry( 
        async context => exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ poolOrg.mainUser.username } --jwtkeyfile ${ await getKeypath()} --instanceurl https://test.salesforce.com -s`), 
        retryOptions
      );

      const result = await retry( 
        async context => exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ poolOrg.mainUser.username } --jwtkeyfile ${ await getKeypath()} --instanceurl https://test.salesforce.com -s`), 
        retryOptions
      );
      
      await exec(`sfdx force:auth:logout -u ${ poolOrg.mainUser.username } -p`);
    } catch (err) {
      throw new Error(err);
    }
    
  }
  // put it back for the next use
  await redis.lpush(`${testRepo.username}.${testRepo.repo}`, JSON.stringify(poolOrg));

  return true;
};

export {requestAddToPool, requestBuildPool}