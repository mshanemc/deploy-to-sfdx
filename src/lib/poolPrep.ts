import * as logger from 'heroku-logger';
import * as util from 'util';

import * as utilities from './utilities';
import { redis, putPoolRequest } from './redisNormal';

import { deployRequest, poolConfig } from './types';

const exec = util.promisify(require('child_process').exec);

export const preparePoolByName = async (
  pool: poolConfig,
  createHerokuDynos: boolean = true
) => {
  const targetQuantity = pool.quantity;
  const poolname = `${pool.user}.${pool.repo}`;

  const actualQuantity = await redis.llen(poolname);

  const messages = [];
  const execs = [];

  if (actualQuantity < targetQuantity) {
    const needed = targetQuantity - actualQuantity;
    logger.debug(
      `pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity}...`
    );

    for (let x = 0; x < needed; x++) {
      const username = poolname.split('.')[0];
      const repo = poolname.split('.')[1];
      const deployId = encodeURIComponent(
        `${username}-${repo}-${new Date().valueOf()}`
      );

      const message: deployRequest = {
        pool: true,
        username,
        repo,
        deployId,
        whitelisted: true
      };

      // branch support
      if (poolname.split('.')[2]) {
        message.branch = poolname.split('.')[2];
      }

      // await redis.rpush('poolDeploys', JSON.stringify(message));
      // await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);
      messages.push(putPoolRequest(message));
      if (createHerokuDynos) {
        execs.push(
          exec(
            `heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`
          )
        );
      }
    }

    await Promise.all(messages);
    await Promise.all(execs);
    logger.debug(`...Requesting ${needed} more org for ${poolname}...`);
  } else {
    logger.debug(
      `pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity} and is full.`
    );
  }
};

export const prepareAll = async () => {
  const pools = <poolConfig[]> await utilities.getPoolConfig();
  logger.debug(`preparing ${pools.length} pools`);

  const prepares = [];
  pools.forEach((pool) => {
    prepares.push(preparePoolByName(pool));
  });

  await Promise.all(prepares);
  logger.debug('all pools prepared');
};
