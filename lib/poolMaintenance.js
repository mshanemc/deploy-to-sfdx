const logger = require('heroku-logger');
const redis = require('./redisNormal');
const utilities = require('./utilities');

const util = require('util');
const exec = util.promisify(require('child_process').exec);


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


const preparePoolByName = async (pool) => {

	const targetQuantity = pool.quantity;
	const poolname = `${pool.user}.${pool.repo}`;

	const actualQuantity = await redis.llen(poolname);

	const messages = [];
	const execs = [];

	if (actualQuantity < targetQuantity) {
		const needed = (targetQuantity - actualQuantity);

		for (let x = 0; x < needed; x++) {

			const message = {
				pool: true,
				username: poolname.split('.')[0],
				repo: poolname.split('.')[1],
				whitelisted: true
			};

			// timestamp to make deploys unique
			message.deployId = encodeURIComponent(`${message.username}-${message.repo}-${new Date().valueOf()}`);

			// branch support
			if (poolname.split('.')[2]) {
				message.branch = poolname.split('.')[2];
			}

			// await redis.rpush('poolDeploys', JSON.stringify(message));
			// await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);
			messages.push(redis.rpush('poolDeploys', JSON.stringify(message)));
			execs.push(exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`));

		}

		await Promise.all(messages);
		await Promise.all(execs);

		return `pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity}.  Requesting ${needed} more org for ${poolname}`;

	} else {
		return `pool ${poolname} has ${actualQuantity} ready out of ${targetQuantity} and is full.`;
	}

};



const prepareAll = async () => {
	const pools = await utilities.getPoolConfig();
	logger.debug(`preparing ${pools.length} pools`);

	pools.forEach( async(pool) => {
		const result = await preparePoolByName(pool);
		logger.debug(result);
	});
};

existingQFlush()
.then( async () => {
	await prepareAll();
	process.exit(0);
});
