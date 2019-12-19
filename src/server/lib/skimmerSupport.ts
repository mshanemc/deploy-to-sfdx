/* eslint-disable no-await-in-loop */
import moment from 'moment';
import logger from 'heroku-logger';

import {
    redis,
    getDeleteQueueSize,
    orgDeleteExchange,
    getHerokuCDSs,
    getAppNamesFromHerokuCDSs,
    getKeysForCDSs,
    cdsRetrieve,
    cdsDelete,
    getDeleteRequest
} from './redisNormal';
import { PoolConfig } from './types';
import { utilities } from './utilities';
import { herokuDelete } from './herokuDelete';
import { exec2JSON } from './execProm';
import { getPoolName } from './namedUtilities';
import { CDS } from './CDS';
import { processWrapper } from './processWrapper';

const checkExpiration = async (pool: PoolConfig): Promise<string> => {
    const poolname = getPoolName(pool);
    const currentPoolSize = await redis.llen(poolname); // how many orgs are there?

    if (currentPoolSize === 0) {
        return `pool ${poolname} is empty`;
    }

    const allMessages = await redis.lrange(poolname, 0, -1); // we'll take them all
    const allOrgs: CDS[] = allMessages.map(msg => JSON.parse(msg));

    const goodOrgs = allOrgs
        .filter(org => moment().diff(moment(org.completeTimestamp), 'hours', true) <= pool.lifeHours)
        .map(org => JSON.stringify(org));

    if (goodOrgs.length === allMessages.length) {
        return `all the orgs in pool ${poolname} are fine`;
    }

    await redis.del(poolname);

    if (goodOrgs.length > 0) {
        // put the good ones back
        logger.debug(`putting ${goodOrgs.length} back in ${poolname}`);
        await redis.lpush(poolname, ...goodOrgs);
    }

    const expiredOrgs = allOrgs
        .filter(org => moment().diff(moment(org.completeTimestamp), 'hours', true) > pool.lifeHours && org.mainUser && org.mainUser.username)
        .map(org => JSON.stringify({ username: org.mainUser.username, delete: true }));

    if (expiredOrgs.length > 0) {
        await redis.rpush(orgDeleteExchange, ...expiredOrgs);
    }
    return `queueing for deletion ${expiredOrgs.length} expired orgs from pool ${poolname}`;
};

const skimmer = async (): Promise<void> => {
    const pools = await utilities.getPoolConfig();
    const promises: Promise<string>[] = [];

    pools.forEach(pool => {
        promises.push(checkExpiration(pool));
    });

    const results = await Promise.all(promises);
    results.forEach(result => logger.debug(result));
};

const doesOrgExist = async (username: string): Promise<boolean> => {
    try {
        const queryResult = await exec2JSON(
            `sfdx force:data:soql:query -u ${processWrapper.HUB_USERNAME} -q "select status from ScratchOrgInfo where SignupUsername='${username}'" --json`
        );
        const status = queryResult.result.records[0].Status;

        if (status === 'Deleted' || status === 'Error') {
            return false;
        } else {
            return true;
        }
    } catch (e) {
        logger.error(`error checking hub for username ${username}`);
        logger.error(e);
        return false;
    }
};

const herokuExpirationCheck = async (): Promise<void> => {
    const herokuCDSs = await getHerokuCDSs();

    if (herokuCDSs.length > 0) {
        if (!processWrapper.HEROKU_API_KEY) {
            logger.warn('there is no heroku API key');
        } else {
            for (const cds of herokuCDSs) {
                // see if the org is deleted
                const exists = await doesOrgExist(cds.mainUser.username);
                if (!exists) {
                    // if deleted or errored on create, do the heroku delete thing
                    for (const appName of await getAppNamesFromHerokuCDSs(cds.mainUser.username)) {
                        await herokuDelete(appName);
                        logger.debug(`deleted heroku app with name ${appName}`);
                    }
                }
            }
        }
    }
};

const removeOldDeployIds = async (): Promise<void> => {
    const deployIds = await getKeysForCDSs();
    for (const deployId of deployIds) {
        const cds = await cdsRetrieve(deployId);
        if (moment().isAfter(moment(cds.expirationDate).endOf('day'))) {
            await cdsDelete(deployId);
        }
    }
};

const processDeleteQueue = async (): Promise<void> => {
    const delQueueInitialSize = await getDeleteQueueSize();

    if (delQueueInitialSize > 0) {
        logger.debug(`deleting ${delQueueInitialSize} orgs`);

        // keep deleting until the queue is empty
        try {
            while ((await getDeleteQueueSize()) > 0) {
                // pull from the delete Request Queue
                const deleteReq = await getDeleteRequest();
                try {
                    logger.debug(`deleting org with username ${deleteReq.username}`);
                    await exec2JSON(
                        `sfdx force:data:record:delete -u ${processWrapper.HUB_USERNAME} -s ActiveScratchOrg -w "SignupUsername='${deleteReq.username}'" --json`
                    );
                } catch (e) {
                    logger.error(e);
                    logger.warn(`unable to delete org with username: ${deleteReq.username}`);
                }

                // go through the herokuCDS for the username
                for (const appName of await getAppNamesFromHerokuCDSs(deleteReq.username, false)) {
                    try {
                        await herokuDelete(appName);
                    } catch (e) {
                        logger.error(e);
                    }
                    logger.debug(`deleted heroku app with name ${appName}`);
                }
            }
        } catch (e) {
            logger.error(e);
        }
    } else {
        logger.debug('no orgs to delete');
    }
};

export { checkExpiration, skimmer, herokuExpirationCheck, removeOldDeployIds, processDeleteQueue };
