import { setInterval } from 'timers';

const cliSetup = require('./cliSetup');
const util = require('util');

const setTimeoutPromise = util.promisify(setTimeout);


async function start(){
	await cliSetup();
	console.log('cli setup is done');

	setInterval(hello(), 1000*60);
}

start();

function hello (){
	console.log('hello');
}