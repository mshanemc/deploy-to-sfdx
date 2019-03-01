import * as logger from 'heroku-logger';
import * as util from 'util';
import { exec } from 'child_process';

import * as utilities from './utilities';
import { getPoolDeployRequestQueueSize } from './redisNormal';
import { prepareAll } from './poolPrep';

const execProm = util.promisify(exec);
const maxPoolBuilders = parseInt(process.env.maxPoolBuilders) || 50;

(async () => {
  if (utilities.checkHerokuAPI()) {
    const currentNeed = Math.min(maxPoolBuilders, await getPoolDeployRequestQueueSize());
    
    if (currentNeed === maxPoolBuilders){
      logger.warn('the poolDeploys queue seems really large');
    }
    
    logger.debug(`starting ${currentNeed} builders for poolQueue`);
    await Promise.all(
      Array(Math.max(0, currentNeed)).fill(
        execProm(
          `heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`
        )
      )
    );
    await prepareAll();
  }
  process.exit(0);
})();
