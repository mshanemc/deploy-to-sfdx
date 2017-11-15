const logger = require('heroku-logger');

module.exports = function logResult(result){
	if (result){
		if (result.stderr){
			logger.error(result.stderr);
		}
		if (result.stdout){
			logger.debug(result.stdout);
		}
	}
};