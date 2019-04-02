import * as logger from 'heroku-logger';
import * as util from 'util';
import { exec } from 'child_process';

import * as utilities from '../lib/utilities';
import { getPoolDeployRequestQueueSize } from '../lib/redisNormal';
import { prepareAll } from '../lib/poolPrep';

const execProm = util.promisify(exec);

const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 30;

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
