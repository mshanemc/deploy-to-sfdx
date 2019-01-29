import * as logger from 'heroku-logger';
import { deployRequest } from './types';

const deployMsgBuilder = function (query): deployRequest {
	
	const template = query.template;
	// validate/sanitize the inputs
	if (!template || !template.includes('https://github.com/')) {
		throw 'There should be a github repo in that url.  Example: /launch?template=https://github.com/you/repo';
	}
	if (template.includes('?')) {
		throw `That template has a ? in it, making the url impossible to parse: ${ template }`;
	}

	if (template.includes('%')) {
		throw `That template has a % in it, making the url impossible to parse: ${ template }`;
	}

	if (template.includes(';')) {
		throw `That template has a semicolon in it, making the url impossible to parse: ${ template }`;
	}

	const path = template.replace('https://github.com/', '');
	const username = path.split('/')[0];
	const repo = path.split('/')[1];

	const deployId = encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}`);

	logger.debug(`template is ${template}`);

	const message: deployRequest = {
		template,
		path,
		username,
		repo,
		deployId
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

	if (path.includes('/tree/')) {
		// we're dealing with a branch
		message.branch = path.split('/tree/')[1];
	}


	// checking for whitelisting
	const whitelist1 = process.env.GITHUB_USERNAME_WHITELIST; // comma separated list of username
	const whitelist2 = process.env.GITHUB_REPO_WHITELIST; // comma separated list of username/repo
	logger.debug(`whitelist1 is ${whitelist1}`);
	logger.debug(`whitelist2 is ${whitelist2}`);

	if (whitelist1) {
		whitelist1.split(',').forEach((username) => {
			if (username.trim() === message.username) {
				message.whitelisted = true;
				logger.debug('hit whitelist from username');
			}
		});
	}

	if (whitelist2) {
		whitelist2.split(',').forEach((repo) => {
			logger.debug(`checking whitelist 2 element: ${repo}`);
			if (repo.trim().split('/')[0] === message.username && repo.trim().split('/')[1] === message.repo) {
				message.whitelisted = true;
				logger.debug('hit whitelist from username/repo');
			}
		});
	}

	logger.debug('deploy message built', message);
	return message;
};

export = deployMsgBuilder;
