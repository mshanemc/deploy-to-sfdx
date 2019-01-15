import * as logger from 'heroku-logger';
import * as checkQueue from './deployQueueCheck';
import * as hubAuth from './hubAuth';

async () => {
  logger.debug('A one-off deploy consumer dyno is up!');
  await hubAuth();
  await checkQueue();
};
