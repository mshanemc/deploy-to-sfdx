const logger = require('heroku-logger');

const checkQueue = require('./deployQueueCheck');
const hubAuth = require('./hubAuth');

logger.debug('I am a deploy (non-pool) consumer and I am up!');

async function runTheLoop(){
	await checkQueue();
	runTheLoop();
}
hubAuth()
	.then( () => runTheLoop() );