const logger = require('heroku-logger');

const exec = require('child-process-promise').exec;

const fs = require('fs');
const logResult = require('./logging');

module.exports = function () {
	// where will our cert live?
	let keypath;

	if (process.env.LOCAL_ONLY_KEY_PATH) {
		// I'm fairly local
		logger.debug('pool...loading local key');
		keypath = process.env.LOCAL_ONLY_KEY_PATH;
	} else {
		// we're doing it in the cloud
		logger.debug('pool...creating cloud key');
		fs.writeFileSync('/app/tmp/server.key', process.env.JWTKEY, 'utf8');
		keypath = '/app/tmp/server.key';
	}

	return new Promise((resolve, reject) => {
		exec('echo y | sfdx plugins:install sfdx-msm-plugin')
			.catch((alreadyExists) => {
				logger.debug(alreadyExists);
				return { stdout: 'plugin already installed' };
			})
			.then(() => {
				return exec('echo y | sfdx plugins:install shane-sfdx-plugins');
			})
			.catch((alreadyExists) => {
				logger.debug(alreadyExists);
				return { stdout: 'plugin already installed' };
			})
			// auth to the hub
			.then((result) => {
				logResult(result);
				return exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a deployBotHub`);
			})  // OK, we've got our environment prepared now.  Let's auth to our org and verify
			.then((result) => {
				logResult(result);
				resolve(true);
			})
			.catch((err) => {
				reject(err);
			});


	});
};
