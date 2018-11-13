import * as logger from 'heroku-logger';

import * as util from 'util';
import * as fs from 'fs';

import * as utilities from './utilities';

const exec = util.promisify(require('child_process').exec);

const hubAuth = async function () {
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

	// array of any sfdx or heroku stuff you need, like plugins, updates.
	const setupCommands = [
		exec('sfdx plugins:link node_modules/shane-sfdx-plugins')
	];
	if (process.env.HEROKU_API_KEY){
		setupCommands.push(exec('heroku update'));
	}

	try {
		const results = await Promise.all(setupCommands);
		results.forEach(result => utilities.loggerFunction(result));
		await exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a deployBotHub`);
	} catch (err) {
		logger.error(err);
		process.exit(1);
	}

	return keypath;
};

export = hubAuth;

