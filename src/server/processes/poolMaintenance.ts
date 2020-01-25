/* eslint-disable no-process-exit */
import { utilities } from '../lib/utilities';
import { getPoolDeployRequestQueueSize } from '../lib/redisNormal';
import { startPoolDeployers } from '../lib/poolPrep';
import { prepareAll } from '../lib/poolPrep';

(async () => {
    if (utilities.checkHerokuAPI()) {
        await Promise.all([
            // kick off builders to deal with existing queue, if any
            startPoolDeployers(await getPoolDeployRequestQueueSize()),
            // put all the messages on the queue
            prepareAll()
        ]);
        // kick off more builders to deal with anything you just added to the queue
        await startPoolDeployers(await getPoolDeployRequestQueueSize());
    }
    process.exit(0);
})();
