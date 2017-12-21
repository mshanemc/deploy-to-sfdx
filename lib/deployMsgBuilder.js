const logger = require('heroku-logger');

module.exports = function (template) {
	logger.debug(`template is ${template}`);
	const message = {
		template
	};

	const path = template.replace('https://github.com/', '');
	message.path = path;
	message.username = path.split('/')[0];
	message.repo = path.split('/')[1];

	if (path.includes('/tree/')) {
		// we're dealing with a branch
		message.branch = path.split('/tree/')[1];
	}

	message.deployId = encodeURIComponent(`${message.username}-${message.repo}-${new Date().valueOf()}`);
	logger.debug('deploy message built');
	logger.debug(message);

	return message;
};
