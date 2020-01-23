import logger from 'heroku-logger';
import ua from 'universal-analytics';

import { utilities } from './utilities';
import { redis, putPoolRequest, getPoolDeployCountByRepo } from './redisNormal';
import { DeployRequest, PoolConfig } from './types';
import { execProm } from './execProm';
import { getPoolName, getDeployId, getPoolConfig } from './namedUtilities';
import { processWrapper } from './processWrapper';

export const preparePoolByName = async (pool: PoolConfig, createHerokuDynos = true): Promise<void> => {
    const targetQuantity = pool.quantity;
    const poolname = getPoolName(pool);

    const actualQuantity = await redis.llen(poolname);

    if (actualQuantity >= targetQuantity) {
        logger.debug(`pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity} and is full.`);
        return;
    }

    // still there?  you must need some more orgs
    if (actualQuantity < targetQuantity) {
        const inFlight = await getPoolDeployCountByRepo(pool);
        const needed = targetQuantity - actualQuantity - inFlight;
        logger.debug(`pool ${poolname} has ${actualQuantity} ready and ${inFlight} in queue out of ${targetQuantity}...`);

        if (needed <= 0) {
            return;
        }
        const deployId = getDeployId(pool.repos[0].username, pool.repos[0].repo);

        const message: DeployRequest = {
            pool: true,
            deployId,
            createdTimestamp: new Date(),
            repos: pool.repos
        };

        if (processWrapper.UA_ID) {
            message.visitor = ua(processWrapper.UA_ID);
        }

        const messages = [];

        while (messages.length < needed) {
            messages.push(putPoolRequest(message));
        }
        await Promise.all(messages);

        logger.debug(`...Requesting ${needed} more org for ${poolname}...`);
        let builders = 0;
        const builderCommand = utilities.getPoolDeployerCommand();

        if (createHerokuDynos) {
            while (builders < Math.min(needed, processWrapper.maxPoolBuilders)) {
                // eslint-disable-next-line no-await-in-loop
                await execProm(builderCommand);
                builders++;
            }
        }
    }
};

export const prepareAll = async (): Promise<void> => {
    const pools = await getPoolConfig();
    logger.debug(`preparing ${pools.length} pools`);

    await Promise.all(pools.map(pool => preparePoolByName(pool)));
    logger.debug('all pools prepared');
};
