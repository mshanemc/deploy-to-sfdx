const logger = require('heroku-logger');

// const exec = require('child-process-promise').exec;
const request = require('request');
const tar = require('tar');

const fs = require('fs');

module.exports = function () {
	return new Promise(async (resolve) => {
		logger.debug('in the setup function');

		fs.mkdirSync('sfdx');

		logger.debug('downloading cli');

		request(process.env.CLI_URL)
		.pipe(fs.createWriteStream('sfdx-cli-linux-x64.tar.xz'))
		.on('error', (err) => {
			logger.error(err);
		})
		.on('response', () => {
			logger.debug('download complete');

			// undo the tarball?
			tar.x({
				file: 'sfdx-cli-linux-x64.tar.xz'
			}).then( () => {
				logger.debug('file extracted');
				resolve(true);
			});
		});

	});

};