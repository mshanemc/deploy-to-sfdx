import * as logger from 'heroku-logger';
import * as util from 'util';
import * as hubAuth from './hubAuth';
import * as checkQueue from './deployQueueCheck';

const setTimeoutPromise = util.promisify(setTimeout);

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