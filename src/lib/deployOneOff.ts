import * as logger from 'heroku-logger';
import * as checkQueue from './deployQueueCheck';
import { auth } from './hubAuth';

(async () => {
  logger.debug('A one-off deploy consumer dyno is up!');
  await auth();
  await checkQueue();
})();
