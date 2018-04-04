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
				const foundPool = pools.find(pool => pool.user === username && pool.repo === repo);
				if (!foundPool) {
					resolve(false); // go back and build it the normal way!
				} else {
					resolve(foundPool);
				}
			});
	})

};