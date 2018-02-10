const exec = require('child-process-promise').exec;
const fs = require('fs');
const logger = require('heroku-logger');
const logResult = require('./lib/logging');
const deployConsumer = require('./lib/deployConsumer');
const poolConsumer = require('./lib/poolConsumer');

logger.debug('I am a worker and I am up!');

let keypath;
// where will our cert live?
if (process.env.LOCAL_ONLY_KEY_PATH){
	// I'm fairly local
	logger.debug('loading local key');
	keypath = process.env.LOCAL_ONLY_KEY_PATH;
} else {
	// we're doing it in the cloud
	logger.debug('creating cloud key');
	fs.writeFileSync('/app/tmp/server.key', process.env.JWTKEY, 'utf8');
	keypath = '/app/tmp/server.key';
}

// load helpful plugins
exec('echo y | sfdx plugins:install sfdx-msm-plugin')
.catch( (alreadyExists) => {
	console.log(alreadyExists);
	return { stdout : 'plugin already installed' };
})
// auth to the hub
.then( (result) => {
	logResult(result);
	return exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a deployBotHub`);
})  // OK, we've got our environment prepared now.  Let's auth to our org and verify
.then( (result) => {
	logResult(result);

	// listens for deploy requests on the deploy queue
	deployConsumer();
	poolConsumer();
	// start prepping pools when the worker loads
})
.catch( (reason) => {
	logger.error(reason);
});









