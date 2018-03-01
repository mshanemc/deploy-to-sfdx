
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
	}

};