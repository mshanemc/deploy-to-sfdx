import * as logger from 'heroku-logger';

import * as utilities from '../lib/utilities';
import { getPoolDeployRequestQueueSize } from '../lib/redisNormal';
import { prepareAll } from '../lib/poolPrep';
import { execProm } from './../lib/execProm';


const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 50;

(async () => {
  if (utilities.checkHerokuAPI()) {
    const currentNeed = Math.min(maxPoolBuilders, await getPoolDeployRequestQueueSize());
        
    if (currentNeed === maxPoolBuilders){
      logger.warn('the poolDeploys queue seems really large');
    }
    
    let builders = 0 ;
    const builderCommand = utilities.getPoolDeployerCommand();
    while (builders < currentNeed) {
      await execProm(builderCommand);
      builders++;
    }
    logger.debug(`stared ${currentNeed} builders for poolQueue`);
    await prepareAll();
  }
  process.exit(0);
})();
