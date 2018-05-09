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
		logger.debug('updating plugin');
		exec('sfdx update')
			.catch((sfdxUpdateWarnings) => {
				logger.error(sfdxUpdateWarnings);
			})
			.then(() => {
				logger.debug('plugin updated');
				return exec('echo y | sfdx plugins:install sfdx-msm-plugin');
			})
			.catch((msmError) => {
				logger.error(msmError);
				return { stdout: 'plugin already installed' };
			})
			.then(() => {
				return exec('echo y | sfdx plugins:install shane-sfdx-plugins');
			})
			.catch((shaneError) => {
				logger.error(shaneError);
				return { stdout: 'plugin already installed' };
			})
			// heroku curl https://cli-assets.heroku.com/install-standalone.sh | sh
			.then(() => {
				return exec('curl https://cli-assets.heroku.com/install-standalone.sh | sh');
			})
			.catch((herokuError) => {
				logger.error(herokuError);
				return { stdout: `heroku install error: ${herokuError}` };
			})
			// auth to the hub
			.then((result) => {
				logResult(result);
				return exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a deployBotHub`);
			})  // OK, we've got our environment prepared now.  Let's auth to our org and verify
			.then((result) => {
				logResult(result);
				resolve(keypath);
			})
			.catch((err) => {
				reject(err);
			});


	});
};
