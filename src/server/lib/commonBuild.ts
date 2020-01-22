// serves as a shared build path for pool and non-pool orgs
import fs from 'fs-extra';
import logger from 'heroku-logger';

import { DeployRequest } from './types';
import { cdsPublish, putHerokuCDS } from './redisNormal';
import { lineRunner } from './lines';
import { timesToGA } from './timeTracking';
import { poolParse } from './poolParse';
import { getCloneCommands, isMultiRepo } from './namedUtilities';
import { CDS } from './CDS';
import { prepOrgInit, prepProjectScratchDef, prepareRepo } from './prepLocalRepo';

const build = async (msgJSON: DeployRequest): Promise<CDS> => {
    let clientResult = new CDS({
        deployId: msgJSON.deployId,
        browserStartTime: msgJSON.createdTimestamp,
        currentCommand: getCloneCommands(msgJSON)[0],
        isPool: msgJSON.pool,
        isByoo: msgJSON.byoo && typeof msgJSON.byoo.accessToken === 'string'
    });

    // get something to redis as soon as possible
    await Promise.all([fs.ensureDir('tmp'), cdsPublish(clientResult)]);

    // clone the repo
    clientResult = await prepareRepo(msgJSON, clientResult);
    await cdsPublish(clientResult);
    if (clientResult.errors.length > 0) {
        return clientResult;
    }

    // figure out the org init file and optionally set the email
    // const orgInitPath = await prepOrgInit(msgJSON);
    // await prepProjectScratchDef(msgJSON);
    const [orgInitPath] = await Promise.all([prepOrgInit(msgJSON), prepProjectScratchDef(msgJSON)]);

    // reads the lines and removes and stores the org open line(s)
    // TODO: multi-repo support for pools
    if (msgJSON.pool && !isMultiRepo(msgJSON)) {
        clientResult.poolLines = await poolParse(orgInitPath);
    }

    try {
        clientResult = await lineRunner(msgJSON, clientResult);
    } catch (e) {
        logger.error('deployQueueCheck: Deployment error', msgJSON);
        logger.error('deployQueueCheck: Deployment error', e);
    }

    await Promise.all([timesToGA(msgJSON, clientResult), fs.remove(`tmp/${msgJSON.deployId}`), putHerokuCDS(clientResult)]);

    return clientResult;
};

export { build };
