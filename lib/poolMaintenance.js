const _ = require('lodash');

const moment = require('moment');
const request = require('request-promise-native');

const logger = require('heroku-logger');

const loopMinutes = process.env.poolLoopTimeMin || 1;
const loopMills = loopMinutes * 1000 * 60;

const skimmerMinutes = process.env.skimmerTimeMin || 60;
const skimmerMills = skimmerMinutes * 1000 * 60;

const redis = require('./redisNormal');
const utilities = require('./utilities');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const poolTracker = {};



// check the environment variables to see what they pools SHOULD be

// getPoolConfig

// one-off dynos to flush anything in the queue already
const existingQFlush = async () => {
	const currentNeed = await redis.llen('poolDeploys');
	if (currentNeed > 0) {
		logger.debug(`going to start ${currentNeed} dynos to handle existing poolDeploys`);
		for (let x = 0; x < currentNeed; x++) {
			await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);
		}
	}
};

const getPools = async () => {
	// const pools = {};
	const pools = await utilities.getPoolConfig();

	_.forEach(pools, (pool) => {
		const properName = `${pool.user}.${pool.repo}`;
			// pools[properName] = pool;
			if (!poolTracker[properName]){
				logger.debug(`intializing tracker for ${properName}`);
				poolTracker[properName] = {
					actual : null,
					enqueuedByMe : 0
				};
			}
	});
	return pools;
};

const getActualQuantity = async (poolname) => {

	const poolsize	= await redis.llen(poolname);
	if (poolTracker[poolname].actual === null){
		// we don't have a value for this one yet
		poolTracker[poolname].actual = poolsize;
		logger.debug(`initializing actual on the tracker for ${poolname}`);
	} else if (poolTracker[poolname].actual < poolsize){
		// there are some newly completed orgs
		const newOrgs = poolsize - poolTracker[poolname].actual;
		logger.debug(`there are ${newOrgs} new orgs I didn't know about for ${poolname}`);

		poolTracker[poolname].enqueuedByMe = Math.max(0, poolTracker[poolname].enqueuedByMe - newOrgs); // they must have been created from my queue
		poolTracker[poolname].actual = poolsize;
	} else if (poolTracker[poolname].actual > poolsize) {
		// someone's been eating my orgs, or they expired.  I'll update my count;
		logger.debug('some orgs I expected to see expired or were used.  Lowering my count');
		poolTracker[poolname].actual = poolsize;
	}
	return poolsize;
};

const preparePoolByName = async (pool) => {

	const targetQuantity = pool.quantity;
	const poolname = `${pool.user}.${pool.repo}`;

	const actualQuantity = await getActualQuantity(poolname);
	const inProgress = poolTracker[poolname].enqueuedByMe;

	logger.debug(`pool ${poolname} has ${actualQuantity} ready and ${inProgress} in progress out of ${targetQuantity}`);


	if (actualQuantity + inProgress < targetQuantity) {
		const needed = targetQuantity - (actualQuantity + inProgress);

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

			await redis.rpush('poolDeploys', JSON.stringify(message));
			poolTracker[poolname].enqueuedByMe = poolTracker[poolname].enqueuedByMe + 1;

			await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);

		}

		return `requesting ${needed} more org for ${poolname}`;

	} else {
		return `pool ${poolname} is full`;
	}

};

const checkExpiration = async (pool) => {

		const poolname = `${pool.user}.${pool.repo}`;
		const poolOrg = await redis.lpop(poolname);

		if (!poolOrg){
			return `pool ${poolname} is empty`;
		}

		const msgJSON = JSON.parse(poolOrg);
		if (moment().diff(moment(msgJSON.createdDate)) > pool.lifeHours * 60 * 60 * 1000) {
			// it's gone if we don't put it back

			// create the delete message
			if (msgJSON.displayResults && msgJSON.displayResults.username){
				await redis.rpush('poolDeploys', JSON.stringify({
					username: msgJSON.displayResults.username,
					delete: true
				}));
			} else {
				logger.warn('pool org did not have a username');
				logger.warn(msgJSON);
			}
			await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);
			return `removed an expired org from pool ${poolname}`;
		} else {
			await redis.lpush(poolname, JSON.stringify(msgJSON));
			return `all the orgs in pool ${poolname} are fine`;
		}
};

const prepareAll = async () => {
	const pools = await getPools();
	_.forEach(pools, async (pool) => {
		const result = await preparePoolByName(pool);
		logger.debug(result);
	});
};

// remove the dead (expired) stuff out of the pool
const skimmer = async () => {

	const pools = await getPools();
	_.forEach(pools, async (pool) => {
		const result = await checkExpiration(pool);
		logger.debug(result);
	});
	// aaah, throw some one-off dyno just in case there's something in the queue we didn't catch.  They'll kill themselves quickly if they're not needed
	await existingQFlush();

};

const herokuExpirationCheck = async () => {

	const herokuDeleteQueueSize = await redis.llen('herokuDeletes');

	if (herokuDeleteQueueSize > 0) {

		for (let x = 0; x < herokuDeleteQueueSize; x++) {

			const herokuDelete = JSON.parse(await redis.lpop('herokuDeletes'));
			if (moment(herokuDelete.expiration).isBefore(moment())) {

				if (!process.env.HEROKU_API_KEY){
					logger.warn('there is no heroku API key');
				} else {
					logger.debug(`deleting heroku app: ${herokuDelete.appName}`);
				}

				const headers = {
					Accept: 'application/vnd.heroku+json; version=3',
					Authorization: `Bearer ${process.env.HEROKU_API_KEY}`
				};

				const result = await request.delete({
					url: `https://api.heroku.com/apps/${herokuDelete.appName}`,
					headers,
					json: true
				});

				logger.debug(result);
			} else {
				redis.rpush('herokuDeletes', JSON.stringify(herokuDelete));
			}
		}
	}

};



// runs only on startup
existingQFlush();

// run once
prepareAll();

// run continually
setInterval(prepareAll, loopMills);

setInterval(skimmer, skimmerMills);

// Goes through the herokuDeletes queue, which have expiration timestamps on them, and destroys anything that should expire
setInterval(herokuExpirationCheck, skimmerMills);


