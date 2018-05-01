const _ = require('lodash');

const moment = require('moment');

const logger = require('heroku-logger');

const loopMinutes = process.env.poolLoopTimeMin || 1;
const loopMills = loopMinutes * 1000 * 60;

const skimmerMinutes = process.env.skimmerTimeMin || 60;
const skimmerMills = skimmerMinutes * 1000 * 60;

const redis = require('./redisNormal');
const utilities = require('./utilities');

const poolTracker = {};

// check the environment variables to see what they pools SHOULD be

// getPoolConfig

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

const getActualQuantity = (poolname) => {
	return new Promise((resolve, reject) => {
		redis.llen(poolname)
			.then((poolsize) => {
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

				resolve(poolsize);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const preparePoolByName = async (pool) => {

	const targetQuantity = pool.quantity;
	const poolname = `${pool.user}.${pool.repo}`;

	const actualQuantity = await getActualQuantity(poolname);
	const inProgress = poolTracker[poolname].enqueuedByMe;

	logger.debug(`pool ${poolname} has ${actualQuantity} ready and ${inProgress} in progress out of ${targetQuantity}`);

	return new Promise( (resolve, reject) => {

		if (actualQuantity + inProgress < targetQuantity) {

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

			redis.rpush('poolDeploys', JSON.stringify(message));
			poolTracker[poolname].enqueuedByMe = poolTracker[poolname].enqueuedByMe + 1;
			resolve(`requesting 1 more org for ${poolname}`);
		} else {
			resolve(`pool ${poolname} is full`);
		}
	});
};

const checkExpiration = async (pool) => {

	return new Promise((resolve, reject) => {
		const poolname = `${pool.user}.${pool.repo}`;
		// update the expiration from the source info

		redis.lpop(poolname)
		.then(async (poolOrg) => {
			if (!poolOrg){
				resolve(`pool ${poolname} is empty`);
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

				return resolve(`removed an expired org from pool ${poolname}`);
			} else {
				return redis.lpush(poolname, JSON.stringify(msgJSON));
			}
		})
		.then(() => {
			resolve(`all the orgs in pool ${poolname} are fine`);
		})
		.catch((err) => {
			reject(err);
		});
	});
};

const prepareAll = async () => {
	const pools = await getPools();
	_.forEach(pools, async (pool) => {
		const result = await preparePoolByName(pool);
		logger.debug(result);
	});
};

const skimmer = async () => {
	const pools = await getPools();
	_.forEach(pools, async (pool) => {
		const result = await checkExpiration(pool);
		logger.debug(result);
	});
};




prepareAll();
setInterval(prepareAll, loopMills);

setInterval(skimmer, skimmerMills);


