import * as moment from 'moment';
import * as logger from 'heroku-logger';
import { retry } from '@lifeomic/attempt';

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
import { poolConfig } from './types';
import * as utilities from './utilities';
import { herokuDelete } from './herokuDelete';
import { auth, getKeypath } from '../lib/hubAuth';
import { execProm } from '../lib/execProm';
import { CDS } from './CDS';

const skimmer = async () => {
    const pools = await utilities.getPoolConfig();
    const promises = [];

    pools.forEach(pool => {
        promises.push(checkExpiration(pool));
    });

    const results = await Promise.all(promises);
    results.forEach(result => logger.debug(result));
};

const checkExpiration = async (pool: poolConfig): Promise<string> => {
    const poolname = `${pool.user}.${pool.repo}`;
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

const herokuExpirationCheck = async () => {
    const herokuCDSs = await getHerokuCDSs();

    if (herokuCDSs.length > 0) {
        if (!process.env.HEROKU_API_KEY) {
            logger.warn('there is no heroku API key');
        } else {
            for (const cds of herokuCDSs) {
                // see if the org is deleted
                const queryResult = await execProm(
                    `sfdx force:data:soql:query -u ${process.env.HUB_USERNAME} -q "select status from ScratchOrgInfo where SignupUsername='${cds.mainUser.username}'" --json`
                );
                try {
                    const status = JSON.parse(queryResult.stdout).result.records[0].Status;

                    if (status === 'Deleted') {
                        // if deleted, do the heroku delete thing
                        for (const appName of await getAppNamesFromHerokuCDSs(cds.mainUser.username)) {
                            await herokuDelete(appName);
                            logger.debug(`deleted heroku app with name ${appName}`);
                        }
                    }
                } catch (e) {
                    logger.error(`error checking hub for username ${cds.mainUser.username}`);
                    logger.error(e);
                }
            }
        }
    }
};

const removeOldDeployIds = async () => {
    const deployIds = await getKeysForCDSs();
    for (const deployId of deployIds) {
        const cds = await cdsRetrieve(deployId);
        if (moment().isAfter(moment(cds.expirationDate).endOf('day'))) {
            await cdsDelete(deployId);
        }
    }
};

const processDeleteQueue = async () => {
    const delQueueInitialSize = await getDeleteQueueSize();
    const retryOptions = { maxAttempts: 60, delay: 5000 };

    if (delQueueInitialSize > 0) {
        logger.debug(`deleting ${delQueueInitialSize} orgs`);
        // auth to the hub
        const keypath = await getKeypath();
        await auth();

        // keep deleting until the queue is empty
        try {
            while ((await getDeleteQueueSize()) > 0) {
                const deleteReq = await getDeleteRequest();

                try {
                    // pull from the delete Request Queue
                    logger.debug(`deleting org with username ${deleteReq.username}`);

                    await retry(
                        async context =>
                            execProm(
                                `sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${deleteReq.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`
                            ),
                        retryOptions
                    );

                    //delete it
                    await execProm(`sfdx force:org:delete -p -u ${deleteReq.username}`);
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
