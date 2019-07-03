import * as logger from 'heroku-logger';

import { auth } from './hubAuth';
import { getPoolRequest, putPooledOrg } from './redisNormal';
import { build } from './commonBuild';

export async function poolBuild() {
    let msgJSON;
    try {
        msgJSON = await getPoolRequest(true);
    } catch (e) {
        if (e.message === 'pool request queue is empty') {
            logger.warn(`failed to build pool: ${e.message}`);
        } else {
            logger.error(`failed to build pool: ${e.message}`);
        }
        return false;
    }

    await auth();
    logger.debug('building a pool org!', msgJSON);

    const buildResult = await build(msgJSON);
    buildResult.poolBuildStartTime = buildResult.buildStartTime;
    buildResult.poolBuildFinishTime = new Date(); // timestamp to see how long pool builds are taking

    await putPooledOrg(msgJSON, buildResult);
    return true;
}
