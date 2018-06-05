const logger = require('heroku-logger');
const util = require('util');
const fs = require('fs');
const exec = util.promisify(require('child_process').exec);

const plugins = [
	'sfdx-msm-plugin',
	'shane-sfdx-plugins'
];

const loggerFunction = (result) => {
	if (result.stdout) {
		logger.debug(result.stdout);
	}
	if (result.stderr) {
		logger.debug(result.stderr);
	}
};

module.exports = async function () {
	// where will our cert live?
	let keypath;

	if (process.env.LOCAL_ONLY_KEY_PATH) {
		// I'm fairly local
		logger.debug('hubAuth...loading local key');
		keypath = process.env.LOCAL_ONLY_KEY_PATH;
	} else {
		// we're doing it in the cloud
		logger.debug('hubAuth...creating cloud key');
		fs.writeFileSync('/app/tmp/server.key', process.env.JWTKEY, 'utf8');
		keypath = '/app/tmp/server.key';
	}

	logger.debug('updating plugin');

	try {
		loggerFunction(await exec('sfdx update'));

		fs.writeFileSync('.config/sfdx/unsignedPluginWhiteList.json', JSON.stringify(plugins));

		loggerFunction(await exec('sfdx plugins:install sfdx-msm-plugin'));

		loggerFunction(await exec('sfdx plugins:install shane-sfdx-plugins'));

		loggerFunction(await exec('heroku update'));

		loggerFunction(await exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a deployBotHub`));

	} catch (err) {
		logger.error(err);
		throw new Error(err);
	}

	return keypath;
};

