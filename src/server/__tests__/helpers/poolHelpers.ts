import { preparePoolByName } from '../../lib/poolPrep';
import { TestRepo } from '../../lib/types';
import { redis } from '../../lib/redisNormal';
// import utilities = require('../../lib/utilities');
import { poolBuild } from '../../lib/poolBuild';
import { buildJWTAuthCommand } from '../../lib/hubAuth';
import { exec } from '../../lib/execProm';
import { retry } from '@lifeomic/attempt';
import { CDS } from '../../lib/CDS';

const retryOptions = { maxAttempts: 90, delay: 5000 };
const requestAddToPool = async (testRepo: TestRepo, quantity = 1) => {
    // add to pool
    await preparePoolByName({
        repos: [
            {
                username: testRepo.username,
                repo: testRepo.repo,
                whitelisted: testRepo.whitelisted,
                branch: testRepo.branch
            }
        ],
        quantity,
        lifeHours: 1
    });

    // verify exists in poolRequests
    const allMessages = await redis.lrange('poolDeploys', 0, -1);
    const msg = allMessages.map(msgIterator => JSON.parse(msgIterator)).find(msgIterator => msgIterator.repos[0].repo === testRepo.repo);

    expect(msg.repos[0].username).toBe(testRepo.username);
    expect(msg.repos[0].repo).toBe(testRepo.repo);
    expect(msg.repos[0].whitelisted).toBe(true);
    expect(msg.pool).toBe(true);
    return true;
};

const requestBuildPool = async (testRepo: TestRepo, requireAuthable?: boolean) => {
    const buildResult = await poolBuild();
    expect(buildResult).toBe(true);

    // verify not in poolRequests
    const allMessages = await redis.lrange('poolDeploys', 0, -1);
    const msg = allMessages.map(msgIterator => JSON.parse(msgIterator)).find(msgIterator => msgIterator.repos[0].repo === testRepo.repo);
    expect(msg).toBeFalsy();

    // verify in the pool for that repo
    const repoPoolSize = await redis.llen(`${testRepo.username}.${testRepo.repo}`);
    expect(repoPoolSize).toBe(1);

    const poolOrg = JSON.parse(await redis.lpop(`${testRepo.username}.${testRepo.repo}`)) as CDS;
    expect(poolOrg.deployId).toContain(testRepo.repo);
    expect(poolOrg.deployId).toContain(testRepo.username);
    expect(typeof poolOrg.poolLines.openLine).toBe('string');
    expect(typeof poolOrg.instanceUrl).toBe('string');
    expect(typeof poolOrg.mainUser.username).toBe('string');

    if (requireAuthable) {
        try {
            // we do this several times to increase the odds of the pool actually working...the first ones to get through sometimes doesn't hit on the findPooledOrg, but many times seems to be pretty sure.
            // it's still flappy sometimes, though
            const builtAuthCommand = `${await buildJWTAuthCommand(poolOrg.mainUser.username)} --instanceurl https://test.salesforce.com -s`;
            await retry(async () => exec(builtAuthCommand), retryOptions);
            await retry(async () => exec(builtAuthCommand), retryOptions);

            await retry(async () => exec(builtAuthCommand), retryOptions);

            await retry(async () => exec(builtAuthCommand), retryOptions);

            await retry(async () => exec(builtAuthCommand), retryOptions);

            await exec(`sfdx force:auth:logout -u ${poolOrg.mainUser.username} -p`);
        } catch (err) {
            throw new Error(err);
        }
    }
    // put it back for the next use
    await redis.lpush(`${testRepo.username}.${testRepo.repo}`, JSON.stringify(poolOrg));

    return true;
};

export { requestAddToPool, requestBuildPool };
