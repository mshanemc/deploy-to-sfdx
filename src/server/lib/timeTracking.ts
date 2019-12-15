import logger from 'heroku-logger';
import { deployRequest } from './types';
import { CDS } from './CDS';

const timesToGA = async (msgJSON: deployRequest, CDS: CDS) => {
    if (msgJSON.pool || !msgJSON.template) {
        // for simpliciy, we only send metrics from pools when they get used.
        return;
    }
    if (!msgJSON.visitor) {
        // also, if there is no GA hooked up, don't try this
        return;
    }
    const repo = `${process.env.SFDX_PRERELEASE ? 'prerelease' : 'regular'}/${msgJSON.template}`;

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

const timeBetweenStringified = (start: Date, end: Date): string => {
    return (new Date(end).getTime() - new Date(start).getTime()).toString();
};
