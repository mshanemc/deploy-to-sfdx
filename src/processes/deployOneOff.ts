import * as logger from 'heroku-logger';
import * as checkQueue from '../lib/deployQueueCheck';
import { auth } from '../lib/hubAuth';

(async () => {
  logger.debug('A one-off deploy consumer dyno is up!');
  await auth();
  await checkQueue();
  process.exit(0);
})();
