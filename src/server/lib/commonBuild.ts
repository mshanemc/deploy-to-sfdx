// serves as a shared build path for pool and non-pool orgs
import fs from 'fs-extra';
import logger from 'heroku-logger';

import { DeployRequest } from './types';
import { cdsPublish, putHerokuCDS } from './redisNormal';
import { lineParse } from './lineParse';
import { lineRunner } from './lines';
import { timesToGA } from './timeTracking';
import { poolParse } from './poolParse';
import { utilities } from './utilities';
import { CDS } from './CDS';
import { prepOrgInit, prepProjectScratchDef, gitClone } from './prepLocalRepo';

const build = async (msgJSON: DeployRequest): Promise<CDS> => {
    let clientResult = new CDS({
        deployId: msgJSON.deployId,
        browserStartTime: msgJSON.createdTimestamp,
        currentCommand: utilities.getCloneCommand(msgJSON),
        isPool: msgJSON.pool,
        isByoo: msgJSON.byoo && typeof msgJSON.byoo.accessToken === 'string'
    });

    // get something to redis as soon as possible
    await Promise.all([fs.ensureDir('tmp'), cdsPublish(clientResult)]);

    // clone the repo
    clientResult = await gitClone(msgJSON, clientResult);
    await cdsPublish(clientResult);
    if (clientResult.errors.length > 0) {
        return clientResult;
    }

    // figure out the org init file and optionally set the email
    const orgInitPath = await prepOrgInit(msgJSON);
    await prepProjectScratchDef(msgJSON);
    // const [orgInitPath, ...toss] = await Promise.all([prepOrgInit(msgJSON), prepProjectScratchDef(msgJSON)]);

    // reads the lines and removes and stores the org open line(s)
    if (msgJSON.pool) {
        clientResult.poolLines = await poolParse(orgInitPath);
    }

    let parsedLines: string[];
    try {
        parsedLines = await lineParse(msgJSON);
        clientResult.lineCount = parsedLines.length + 1; //1 extra to account for the git clone command
        await cdsPublish(clientResult);
    } catch (e) {
        clientResult.errors.push({
            command: 'line parsing',
            error: e,
            raw: e
        });
        clientResult.complete = true;
        await cdsPublish(clientResult);
        return clientResult;
    }

    const localLineRunner = new lineRunner(msgJSON, parsedLines, clientResult);

    try {
        clientResult = (await localLineRunner.runLines()) as CDS;
    } catch (e) {
        logger.error('deployQueueCheck: Deployment error', msgJSON);
        logger.error('deployQueueCheck: Deployment error', e);
    }

    await Promise.all([timesToGA(msgJSON, clientResult), fs.remove(`tmp/${msgJSON.deployId}`), putHerokuCDS(clientResult)]);

    return clientResult;
};

export { build };
