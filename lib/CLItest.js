
const cliSetup = require('./cliSetup');
const util = require('util');
const logger = require('heroku-logger');

const setTimeoutPromise = util.promisify(setTimeout);

function hello() {
	console.log('hello');
}

async function start(){
	console.log('cli setup is starting');

	try {
		await cliSetup();
	} catch (e){
		logger.error(e);
	}

	console.log('cli setup is done');


}

start();
setInterval(hello, 1000 * 60);

