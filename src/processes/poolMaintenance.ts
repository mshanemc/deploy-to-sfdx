import * as logger from 'heroku-logger';

import * as utilities from '../lib/utilities';
import { getPoolDeployRequestQueueSize } from '../lib/redisNormal';
import { prepareAll } from '../lib/poolPrep';

const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 50;

(async () => {
  if (utilities.checkHerokuAPI()) {
    const currentNeed = Math.min(maxPoolBuilders, await getPoolDeployRequestQueueSize());
        
    if (currentNeed === maxPoolBuilders){
      logger.warn('the poolDeploys queue seems really large');
    }
    
    logger.debug(`starting ${currentNeed} builders for poolQueue`);

    const builders = [];
    const builderCommand = utilities.getPoolDeployerCommand()
    while (builders.length < currentNeed){
      builders.push(builderCommand);
    }
    await Promise.all(builders);
    await prepareAll();
  }
  process.exit(0);
})();
