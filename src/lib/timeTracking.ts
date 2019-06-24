import * as logger from 'heroku-logger';
import { deployRequest } from './types';
import { CDS } from './CDS';

const timesToGA = (msgJSON: deployRequest, CDS: CDS) => {
  
    try {
      msgJSON.visitor
        .timing(
          'time in queue',
          msgJSON.template,
          new Date(CDS.buildStartTime).getTime() - new Date(CDS.browserStartTime).getTime()
        )
        .send();
      msgJSON.visitor
        .timing(
          'time to build',
          msgJSON.template,
          new Date(CDS.completeTimestamp).getTime() - new Date(CDS.buildStartTime).getTime()
        )
        .send();
      msgJSON.visitor
        .timing(
          'time until fully deployed',
          msgJSON.template,
          new Date(CDS.completeTimestamp).getTime() - new Date(CDS.browserStartTime).getTime()
        )
        .send();
      msgJSON.visitor
        .timing(
          'time until open button appears',
          msgJSON.template,
          new Date(CDS.openTimestamp).getTime() - new Date(CDS.browserStartTime).getTime()
        )
        .send();
    } catch (e) {
      logger.warn('GA timestamps not firing', msgJSON);
      logger.warn('acutal GA error', e);
    }
  };

  export { timesToGA}