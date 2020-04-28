import logger from 'heroku-logger';
import { DeployRequest } from './types';
import { CDS } from './CDS';
import { processWrapper } from './processWrapper';
import { getPoolKey } from './namedUtilities';

const timeBetweenStringified = (start: Date, end: Date): string => (new Date(end).getTime() - new Date(start).getTime()).toString();

const iterateCommandResults = async (repo: string, cds: CDS, msgJSON: DeployRequest): Promise<void> => {
    try {
        // how long did the user wait until the open button appears
        cds.commandResults.forEach((commandResult) => {
            msgJSON.visitor
                .timing(
                    'commandTiming',
                    repo,
                    timeBetweenStringified(commandResult.commandStartTimestamp, commandResult.commandCompleteTimestamp),
                    commandResult.command
                )
                .send();
        });
    } catch (e) {
        logger.warn('GA command timestamps not firing', msgJSON);
        logger.warn('acutal GA error', e);
    }
};

const timesToGA = async (msgJSON: DeployRequest, cds: CDS): Promise<void> => {
    if (!msgJSON.visitor) {
        // also, if there is no GA hooked up, don't try this
        return;
    }

    const repo = `${processWrapper.SFDX_PRERELEASE ? 'prerelease' : 'regular'}/${getPoolKey(msgJSON, '-')}`;

    // log command stuff from the pool after it builds, but then exit and don't hit the high-level metrics for end user experience.
    if (msgJSON.pool) {
        await iterateCommandResults(repo, cds, msgJSON);
        return;
    }

    try {
        // end user experience
        msgJSON.visitor.timing('time until open button appears', repo, timeBetweenStringified(cds.browserStartTime, cds.openTimestamp)).send();
        msgJSON.visitor.timing('time until fully deployed', repo, timeBetweenStringified(cds.browserStartTime, cds.completeTimestamp)).send();
        msgJSON.visitor.timing('time in queue', repo, timeBetweenStringified(cds.browserStartTime, cds.buildStartTime)).send();
        msgJSON.visitor.timing('time to build', repo, timeBetweenStringified(cds.buildStartTime, cds.completeTimestamp)).send();
    } catch (e) {
        logger.warn('GA timestamps not firing', msgJSON);
        logger.warn('acutal GA error', e);
    }

    // do the command timestamps if it was never a pool
    if (!cds.poolBuildFinishTime) {
        await iterateCommandResults(repo, cds, msgJSON);
    }
};

export { timesToGA };
