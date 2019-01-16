import * as logger from 'heroku-logger';
import * as util from 'util';
import { exec } from 'child_process';

import * as utilities from './utilities';
import { getPoolDeployRequestQueueSize } from './redisNormal';
import { prepareAll } from './poolPrep';

const execProm = util.promisify(exec);

(async () => {
  if (utilities.checkHerokuAPI()) {
    const currentNeed = await getPoolDeployRequestQueueSize();

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
})();
