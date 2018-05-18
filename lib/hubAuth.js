const logger = require('heroku-logger');

const exec = require('child-process-es6-promise').exec;

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
				logger.error('sfdx plugin update error');
				logger.error(sfdxUpdateWarnings);
				process.exit(1);
			})
			.then(() => {
				logger.debug('sfdx core plugin updated');
				return exec('echo y | sfdx plugins:install sfdx-msm-plugin');
			})
			.catch((msmError) => {
				logger.error('error installing msm plugin');
				logger.error(msmError);
				process.exit(1);
				return { stdout: 'plugin already installed' };
			})
			.then(() => {
				logger.debug('msm plugin installed');
				return exec('heroku update');
			})
			.then(() => {
				// logger.debug(json.stringify(herokuResult));
				return exec('echo y | sfdx plugins:install shane-sfdx-plugins');
			})
			.catch((shaneError) => {
				logger.error('error installing shane plugin');
				logger.error(shaneError);
				process.exit(1);
				return { stdout: 'plugin already installed' };
			})
			// auth to the hub
			.then((result) => {
				logger.debug('shane plugin installed');
				logResult(result);
				return exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a deployBotHub`);
			})  // OK, we've got our environment prepared now.  Let's auth to our org and verify
			.then((result) => {
				logResult(result);
			// 	return exec(`export HEROKU_API_KEY=${process.env.HEROKU_API_KEY}`);
			// })
			// .then(() => {
			// 	logger.debug('heroku api key set');
				resolve(keypath);
			})
			.catch((err) => {
				logger.error('some error occured in the HubAuth for this process.  exiting...');
				process.exit(1);
				reject(err);
			});


	});
};
