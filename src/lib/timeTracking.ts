import * as logger from 'heroku-logger';
import { clientDataStructure, deployRequest } from './types';

const timesToGA = (msgJSON: deployRequest, CDS: clientDataStructure) => {
    try {
      msgJSON.visitor
        .timing(
          'time in queue',
          msgJSON.template,
          CDS.buildStartTime.getTime() - CDS.browserStartTime.getTime()
        )
        .send();
      msgJSON.visitor
        .timing(
          'time to build',
          msgJSON.template,
          CDS.completeTimestamp.getTime() - CDS.buildStartTime.getTime()
        )
        .send();
      msgJSON.visitor
        .timing(
          'time until fully deployed',
          msgJSON.template,
          CDS.completeTimestamp.getTime() - CDS.browserStartTime.getTime()
        )
        .send();
      msgJSON.visitor
        .timing(
          'time until open button appears',
          msgJSON.template,
          CDS.openTimestamp.getTime() - CDS.browserStartTime.getTime()
        )
        .send();
    } catch (e) {
      logger.warn('GA timestamps not firing', msgJSON);
    }
  };

  export { timesToGA}