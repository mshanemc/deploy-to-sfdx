const logger = require('heroku-logger');
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);

const checkQueue = require('./deployQueueCheck');
const hubAuth = require('./hubAuth');

logger.debug('I am a deploy (non-pool) consumer and I am up!');

async function runTheLoop(){
	const processedSomething = await checkQueue();
	if (!processedSomething){
		await setTimeoutPromise(1000);
	}
	runTheLoop();
}
hubAuth()
	.then( () => runTheLoop() );