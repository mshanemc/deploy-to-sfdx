const logger = require('heroku-logger');

module.exports = function (query) {
	const template = query.template;

	logger.debug(`template is ${template}`);
	const message = {
		template
	};

	if (query.email){
		message.email = query.email;
	}

	if (query.firstname){
		message.firstname = query.firstname;
	}

	if (query.lastname){
		message.lastname = query.lastname;
	}

	if (query.pool){
		message.pool = true;
	}

	const path = template.replace('https://github.com/', '');
	message.path = path;
	message.username = path.split('/')[0];
	message.repo = path.split('/')[1];

	if (path.includes('/tree/')) {
		// we're dealing with a branch
		message.branch = path.split('/tree/')[1];
	}

	message.deployId = encodeURIComponent(`${message.username}-${message.repo}-${new Date().valueOf()}`);

	// checking for whitelisting
	const whitelist1 = process.env.GITHUB_USERNAME_WHITELIST; // comma separated list of username
	const whitelist2 = process.env.GITHUB_REPO_WHITELIST; // comma separated list of username/repo
	logger.debug(`whitelist1 is ${whitelist1}`);
	logger.debug(`whitelist2 is ${whitelist2}`);

	if (whitelist1) {
		for (const username of whitelist1.split(',')) {
			if (username.trim() === message.username) {
				message.whitelisted = true;
				logger.debug('hit whitelist from username');
			}
		}
	}

	if (whitelist2) {
		for (const repo of whitelist2.split(',')) {
			logger.debug(`checking whitelist 2 element: ${repo}`);
			if (repo.trim().split('/')[0] === message.username && repo.trim().split('/')[1] === message.repo) {
				message.whitelisted = true;
				logger.debug('hit whitelist from username/repo');
			}
		}
	}

	logger.debug('deploy message built');
	logger.debug(message);

	return message;
};
