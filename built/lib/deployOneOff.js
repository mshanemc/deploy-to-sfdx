const logger = require('heroku-logger');
const checkQueue = require('./deployQueueCheck');
const hubAuth = require('./hubAuth');
logger.debug('A one-off deploy consumer dyno is up!');
hubAuth()
    .then(async () => {
    await checkQueue();
    process.exit(0);
});
