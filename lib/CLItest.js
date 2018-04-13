
const cliSetup = require('./cliSetup');
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);

function hello() {
	console.log('hello');
}

async function start(){
	console.log('cli setup is starting');

	await cliSetup();
	console.log('cli setup is done');

	setInterval(hello(), 1000*60);
}

start();

