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
    
    logger.debug(`starting ${currentNeed} builders for poolQueue`);
    let command = utilities.getPoolDeployerCommand();
    await Promise.all(
      Array(Math.max(0, currentNeed)).fill(
        execProm(command)
      )
    );
    await prepareAll();
  }
  process.exit(0);
})();
