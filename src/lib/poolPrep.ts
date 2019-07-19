import * as logger from 'heroku-logger';

import * as utilities from './utilities';
import { redis, putPoolRequest, getPoolDeployCountByRepo } from './redisNormal';
import { deployRequest, poolConfig } from './types';
import { execProm } from '../lib/execProm';
import { getPoolName } from './namedUtilities';

import * as ua from 'universal-analytics';

export const preparePoolByName = async (pool: poolConfig, createHerokuDynos: boolean = true) => {
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
        const deployId = encodeURIComponent(`${pool.user}-${pool.repo}-${new Date().valueOf()}`);

        const username = poolname.split('.')[0];
        const repo = poolname.split('.')[1];

        const message: deployRequest = {
            pool: true,
            username,
            repo,
            deployId,
            whitelisted: true,
            createdTimestamp: new Date()
        };

        if (process.env.UA_ID) {
            message.visitor = ua(process.env.UA_ID);
        }

        // branch support
        if (pool.branch) {
            message.branch = pool.branch;
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
            while (builders < needed && builders < 50) {
                await execProm(builderCommand);
                builders++;
            }
        }
    }
};

export const prepareAll = async () => {
    const pools = <poolConfig[]>await utilities.getPoolConfig();
    logger.debug(`preparing ${pools.length} pools`);

    await Promise.all(pools.map(pool => preparePoolByName(pool)));
    logger.debug('all pools prepared');
};
