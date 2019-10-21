import logger from 'heroku-logger';
import { deployRequest } from './types';
import { CDS } from './CDS';

const timesToGA = (msgJSON: deployRequest, CDS: CDS) => {
    if (msgJSON.template) {
        try {
            msgJSON.visitor
                .timing(
                    'time in queue',
                    msgJSON.template,
                    (new Date(CDS.buildStartTime).getTime() - new Date(CDS.browserStartTime).getTime()).toString()
                )
                .send();
            msgJSON.visitor
                .timing(
                    'time to build',
                    msgJSON.template,
                    (new Date(CDS.completeTimestamp).getTime() - new Date(CDS.buildStartTime).getTime()).toString()
                )
                .send();
            msgJSON.visitor
                .timing(
                    'time until fully deployed',
                    msgJSON.template,
                    (new Date(CDS.completeTimestamp).getTime() - new Date(CDS.browserStartTime).getTime()).toString()
                )
                .send();
            msgJSON.visitor
                .timing(
                    'time until open button appears',
                    msgJSON.template,
                    (new Date(CDS.openTimestamp).getTime() - new Date(CDS.browserStartTime).getTime()).toString()
                )
                .send();
        } catch (e) {
            logger.warn('GA timestamps not firing', msgJSON);
            logger.warn('acutal GA error', e);
        }
    }
};

export { timesToGA };
