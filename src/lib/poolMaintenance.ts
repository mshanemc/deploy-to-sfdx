import * as logger from 'heroku-logger';
import * as util from 'util';

import * as utilities from './utilities';
import * as redis from './redisNormal';
import { prepareAll } from './poolPrep';


const exec = util.promisify(require('child_process').exec);

utilities.checkHerokuAPI();

// one-off dynos to flush anything in the queue already
const existingQFlush = async () => {
	const currentNeed = await redis.llen('poolDeploys');
	if (currentNeed > 0) {
		logger.debug(`going to start ${currentNeed} dynos to handle existing poolDeploys`);
		const execs = [];
		for (let x = 0; x < currentNeed; x++) {
			execs.push(exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`));
		}
		await Promise.all(execs);
	} else {
		logger.debug('no additional builders needed for poolQueue');
	}
};

existingQFlush()
.then( async () => {
	await prepareAll();
	process.exit(0);
});
