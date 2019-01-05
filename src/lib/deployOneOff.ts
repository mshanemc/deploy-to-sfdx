import * as logger from 'heroku-logger';
import * as checkQueue from './deployQueueCheck';
import * as hubAuth from './hubAuth';


logger.debug('A one-off deploy consumer dyno is up!');

hubAuth()
  .then(async () => {
    await checkQueue();
    process.exit(0);
  });