import logger from 'heroku-logger';
import { deployRequest } from './types';
import { CDS } from './CDS';
import { processWrapper } from './processWrapper';

const timesToGA = async (msgJSON: deployRequest, CDS: CDS) => {
    if (!msgJSON.visitor) {
        // also, if there is no GA hooked up, don't try this
        return;
    }

    const repo = `${processWrapper.SFDX_PRERELEASE ? 'prerelease' : 'regular'}/${msgJSON.template || msgJSON.repo}`;

    // log command stuff from the pool after it builds, but then exit and don't hit the high-level metrics for end user experience.
    if (msgJSON.pool) {
        await iterateCommandResults(repo, CDS, msgJSON);
        return;
    }

    try {
        // end user experience
        msgJSON.visitor.timing('time until open button appears', repo, timeBetweenStringified(CDS.browserStartTime, CDS.openTimestamp)).send();
        msgJSON.visitor.timing('time until fully deployed', repo, timeBetweenStringified(CDS.browserStartTime, CDS.completeTimestamp)).send();
        msgJSON.visitor.timing('time in queue', repo, timeBetweenStringified(CDS.browserStartTime, CDS.buildStartTime)).send();
        msgJSON.visitor.timing('time to build', repo, timeBetweenStringified(CDS.buildStartTime, CDS.completeTimestamp)).send();
    } catch (e) {
        logger.warn('GA timestamps not firing', msgJSON);
        logger.warn('acutal GA error', e);
    }

    // do the command timestamps if it was never a pool
    if (!CDS.poolBuildFinishTime) {
        await iterateCommandResults(repo, CDS, msgJSON);
    }
};

const timeBetweenStringified = (start: Date, end: Date): string => {
    return (new Date(end).getTime() - new Date(start).getTime()).toString();
};

const iterateCommandResults = async (repo: string, CDS: CDS, msgJSON: deployRequest) => {
    try {
        // how long did the user wait until the open button appears
        CDS.commandResults.forEach(commandResult => {
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

export { timesToGA };
