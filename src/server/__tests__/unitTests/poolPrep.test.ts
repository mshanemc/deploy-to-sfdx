import { preparePoolByName } from '../../lib/poolPrep';
import { PoolConfig, DeployRequest } from '../../lib/types';
import { redis, getPoolDeployCountByRepo, poolDeployExchange } from '../../lib/redisNormal';
import { getPoolName } from '../../lib/namedUtilities';

const username = 'mshanemc';

const basePC: PoolConfig = {
    lifeHours: 1,
    quantity: 10,
    repos: [
        {
            username,
            repo: 'repo1',
            whitelisted: false
        }
    ]
};

const poolname = getPoolName(basePC);

describe('poolPrep Test', () => {
    beforeAll(async () => {
        await redis.del(poolDeployExchange);
    });

    test('preps a pool with nothing in the queue', async () => {
        expect(await redis.llen(poolname)).toBe(0);
        await preparePoolByName(basePC);
        expect(await getPoolDeployCountByRepo(basePC)).toBe(10);
    });

    test('preps a pool with some in the build queue', async () => {
        expect(await getPoolDeployCountByRepo(basePC)).toBe(10);

        // remove something from it
        let requests: DeployRequest[] = (await redis.lrange(poolDeployExchange, 0, -1)).map(queueItem => JSON.parse(queueItem));

        requests.splice(
            requests.findIndex(req => req.repos[0].repo === basePC.repos[0].repo && req.repos[0].username === basePC.repos[0].username),
            1
        );
        requests.splice(
            requests.findIndex(req => req.repos[0].repo === basePC.repos[0].repo && req.repos[0].username === basePC.repos[0].username),
            1
        );

        expect(requests.length).toBe(8);
        await redis.del(poolDeployExchange);
        await redis.lpush(poolDeployExchange, ...(requests as any[]).map(req => JSON.stringify(req)));
        await preparePoolByName(basePC);
        expect(await getPoolDeployCountByRepo(basePC)).toBe(10);
    });

    afterAll(async () => {
        await redis.del(poolDeployExchange);
    });
});
