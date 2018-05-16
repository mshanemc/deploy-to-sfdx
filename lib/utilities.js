const request = require('request');


module.exports = {
	getKey: msgJSON => new Promise((resolve, reject) => {

		if (!msgJSON.username) {
			reject('msg does not have username');
		}
		if (!msgJSON.repo) {
			reject('msg does not have repo');
		}

		let key = `${msgJSON.username}.${msgJSON.repo}`;
		if (msgJSON.branch) {
			key = `${msgJSON.username}.${msgJSON.repo}.${msgJSON.branch}`;
		}
		resolve(key);

	}),

	bufferKey: (content, deployId) => {
		const message = {
			deployId,
			content
		};
		return JSON.stringify(message);
	},

	// fetches the pools object from some external URL
	// [{
	// 	user : 'mshanemc',
	// 	repo : 'exampleRepo',
	// 	quantitiy: 4,
	//	lifeHours: 12
	// }]

	getPoolConfig: () => new Promise((resolve, reject) => {

		// TODO: fallback as a singleton?
		if (!process.env.POOLCONFIG_URL){
			resolve({});
		}
		request(process.env.POOLCONFIG_URL, (error, response, body) => {
			if (error){
				reject(error);
			} else {
				resolve(JSON.parse(body));
			}
		});
	}),

	getPool: (username, repo) => new Promise(async (resolve, reject) => {

		module.exports.getPoolConfig()
			.then((pools) => {
				if (!pools || !pools.find){
					resolve(false);
				}
				const foundPool = pools.find(pool => pool.user === username && pool.repo === repo);
				if (!foundPool) {
					resolve(false); // go back and build it the normal way!
				} else {
					resolve(foundPool);
				}
			})
			.catch( () => {
				resolve(false);
			});
	}),

	getArg: (cmd, parameter) => {
		cmd = cmd.concat(' ');
		const bufferedParam = ' '.concat(parameter).concat(' ');
		// takes a command line command and removes a parameter.  Make noarg true if it's a flag (parameter with no arguments), like sfdx force:org:create -s

		// ex:
		// cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
		// parameter = '-a'

			// quickly return if it doesn't exist
		if (!cmd.includes(bufferedParam)) {
				console.log('param not in command');
				return false;
			} else {
				// find the string
				const paramStartIndex = cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;

				console.log(`param starts at ${paramStartIndex}`);
				const paramEndIndex = paramStartIndex + parameter.length - 1; // because there'll be a space, and because origin
				console.log(`param ends at ${paramEndIndex}`);
				const paramValueStart = paramEndIndex + 2;
				console.log(`value starts at ${paramValueStart}`);
				let paramValueEnd;
				// if it starts with a ` or ' or " we need to find the other end.  Otherwise, it's a space
				if (cmd.charAt(paramValueStart) === '"' || cmd.charAt(paramValueStart) === '\'' || cmd.charAt(paramValueStart) === '`') {
					// logger.debug(`it is a quoted string starting with ${cmd.charAt(paramValueStart)}`);
					const quoteEnd = cmd.indexOf(cmd.charAt(paramValueStart), paramValueStart + 1);
					if (cmd.charAt(quoteEnd + 1) === ' ') {
						paramValueEnd = quoteEnd;
					} else {
						paramValueEnd = cmd.indexOf(' ', quoteEnd + 1) - 1;
					}
				} else {
					// normal type with a space
					paramValueEnd = cmd.indexOf(' ', paramValueStart) - 1;
				}
				console.log(`value ends at ${paramValueEnd}`);
				return cmd.substring(paramValueStart, paramValueEnd+1).trim();
				// output = cmd.slice(0, paramStartIndex - 1).concat(' ').concat(cmd.slice(paramValueEnd + 2));

			}

	}

};