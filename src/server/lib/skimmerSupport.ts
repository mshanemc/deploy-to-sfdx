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
    getDeleteRequest,
    getAllPooledOrgs
} from './redisNormal';
import { PoolConfig } from './types';
import { herokuDelete } from './herokuDelete';
import { exec2JSON } from './execProm';
import { getPoolName, getPoolConfig } from './namedUtilities';
import { processWrapper } from './processWrapper';

const hoursToKeepBYOO = 12;

const checkExpiration = async (pool: PoolConfig): Promise<string> => {
    const poolname = getPoolName(pool);
    const allOrgs = await getAllPooledOrgs(poolname);
    if (allOrgs.length === 0) {
        return `pool ${poolname} is empty`;
    }
    const goodOrgs = allOrgs
        .filter((org) => moment().diff(moment(org.completeTimestamp), 'hours', true) <= pool.lifeHours)
        .map((org) => JSON.stringify(org));

    if (goodOrgs.length === allOrgs.length) {
        return `all the orgs in pool ${poolname} are fine`;
    }

    await redis.del(poolname);

    if (goodOrgs.length > 0) {
        // put the good ones back
        logger.debug(`putting ${goodOrgs.length} back in ${poolname}`);
        await redis.lpush(poolname, ...goodOrgs);
    }

    const expiredOrgs = allOrgs
        .filter((org) => moment().diff(moment(org.completeTimestamp), 'hours', true) > pool.lifeHours && org.mainUser && org.mainUser.username)
        .map((org) => JSON.stringify({ username: org.mainUser.username, delete: true }));

    if (expiredOrgs.length > 0) {
        await redis.rpush(orgDeleteExchange, ...expiredOrgs);
    }
    return `queueing for deletion ${expiredOrgs.length} expired orgs from pool ${poolname}`;
};

const skimmer = async (): Promise<void> => {
    const pools = await getPoolConfig();
    const results = await Promise.all(pools.map((pool) => checkExpiration(pool)));
    results.forEach((result) => logger.debug(result));
};

const doesOrgExist = async (username: string): Promise<boolean> => {
    try {
        const queryResult = await exec2JSON(
            `sfdx force:data:soql:query -u ${processWrapper.HUB_USERNAME} -q "select status from ScratchOrgInfo where SignupUsername='${username}'" --json`
        );
        return !['Deleted', 'Error'].includes(queryResult.result.records[0].Status);
    } catch (e) {
        logger.error(`error checking hub for username ${username}`);
        logger.error(e);
        return false;
    }
};

/**
 * If an org has already expired or been deleted (including due to  errors on org:create) then this will delete its related Heroku apps
 */
const herokuExpirationCheck = async (): Promise<void> => {
    const herokuCDSs = await getHerokuCDSs();

    if (herokuCDSs.length <= 0) {
        return;
    }
    if (!processWrapper.HEROKU_API_KEY) {
        logger.warn('there is no heroku API key');
        return;
    }

    for (const cds of herokuCDSs) {
        // see if the org is deleted
        if (!(await doesOrgExist(cds.mainUser.username))) {
            // if deleted or errored on create, do the heroku delete thing
            for (const appName of await getAppNamesFromHerokuCDSs(cds.mainUser.username)) {
                await herokuDelete(appName);
                logger.debug(`deleted heroku app with name ${appName}`);
            }
        }
    }
};

const removeOldDeployIds = async (): Promise<void> => {
    const deployIds = await getKeysForCDSs();
    const CDSs = (await Promise.all(deployIds.map((deployId) => cdsRetrieve(deployId)))).filter((cds) => cds.mainUser && cds.mainUser.username);
    await Promise.all(
        CDSs.map((cds) => {
            if (!cds.expirationDate && moment().diff(moment(cds.browserStartTime), 'hours') > hoursToKeepBYOO) {
                return cdsDelete(cds.deployId);
            }
            if (cds.expirationDate && moment().isAfter(moment(cds.expirationDate).endOf('day'))) {
                return cdsDelete(cds.deployId);
            }
            return undefined;
        }).filter((item) => item)
    );
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
                logger.debug(`deleting org with username ${deleteReq.username}`);

                await exec2JSON(
                    `sfdx force:data:record:delete -u ${processWrapper.HUB_USERNAME} -s ActiveScratchOrg -w "SignupUsername='${deleteReq.username}'" --json`
                ).catch((e) => {
                    logger.error(e);
                    logger.warn(`unable to delete org with username: ${deleteReq.username}`);
                });

                // go through the herokuCDS for the username
                for (const appName of await getAppNamesFromHerokuCDSs(deleteReq.username, false)) {
                    try {
                        await herokuDelete(appName);
                        logger.debug(`deleted heroku app with name ${appName}`);
                    } catch (e) {
                        logger.error(e);
                    }
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
