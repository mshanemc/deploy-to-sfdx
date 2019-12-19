/* eslint-disable no-process-exit */
import logger from 'heroku-logger';

import { utilities } from '../lib/utilities';
import { getPoolDeployRequestQueueSize } from '../lib/redisNormal';
import { prepareAll } from '../lib/poolPrep';
import { execProm } from '../lib/execProm';
import { processWrapper } from '../lib/processWrapper';

(async () => {
    if (utilities.checkHerokuAPI()) {
        const currentNeed = Math.min(processWrapper.maxPoolBuilders, await getPoolDeployRequestQueueSize());

        if (currentNeed === processWrapper.maxPoolBuilders) {
            logger.warn('the poolDeploys queue seems really large');
        }

        let builders = 0;
        const builderCommand = utilities.getPoolDeployerCommand();
        while (builders < currentNeed) {
            // eslint-disable-next-line no-await-in-loop
            await execProm(builderCommand);
            builders++;
        }
        logger.debug(`stared ${currentNeed} builders for poolQueue`);
        await prepareAll();
    }
    process.exit(0);
})();
