import * as logger from 'heroku-logger';
import * as util from 'util';
import { exec } from 'child_process';

import * as utilities from '../lib/utilities';
import { getPoolDeployRequestQueueSize } from '../lib/redisNormal';
import { prepareAll } from '../lib/poolPrep';

const execProm = util.promisify(exec);

const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 50;

(async () => {
  if (utilities.checkHerokuAPI()) {
    const currentNeed = Math.min(maxPoolBuilders, await getPoolDeployRequestQueueSize());
        
    if (currentNeed === maxPoolBuilders){
      logger.warn('the poolDeploys queue seems really large');
    }
    
    const builders = [];
    const builderCommand = utilities.getPoolDeployerCommand()
    while (builders.length < currentNeed){
      builders.push(execProm(builderCommand));
    }
    logger.debug(`starting ${builders.length} of ${currentNeed} builders for poolQueue`);
    await Promise.all(builders);
    await prepareAll();
  }
  process.exit(0);
})();
