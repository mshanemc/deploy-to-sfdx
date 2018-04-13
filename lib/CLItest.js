const cliSetup = require('./cliSetup');
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);


async function start(){
	await cliSetup();
	setTimeoutPromise(1000 * 1000000000)
		.then(() => {
			console.log('hello');
		});
}

start();