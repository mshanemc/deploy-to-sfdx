import logger from 'heroku-logger';

import { auth } from './hubAuth';
import { getPoolRequest, putPooledOrg } from './redisNormal';
import { build } from './commonBuild';

export async function poolBuild(): Promise<boolean> {
    const msgJSON = await getPoolRequest(true).catch((e) => {
        if (e.message === 'pool request queue is empty') {
            logger.warn(`failed to build pool: ${e.message}`);
        } else {
            logger.error(`failed to build pool: ${e.message}`);
        }
    });

    if (!msgJSON) {
        return false;
    }

    await auth();
    logger.debug('building a pool org!', msgJSON);

    const buildResult = await build(msgJSON);

    await putPooledOrg(msgJSON, {
        ...buildResult,
        poolBuildStartTime: buildResult.buildStartTime,
        poolBuildFinishTime: new Date()
    });
    return true;
}
