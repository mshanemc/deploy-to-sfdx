const _ = require('lodash');
const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');
const logger = require('heroku-logger');

const loopMinutes = process.env.poolLoopTime || 1;
const loopMills = loopMinutes * 1000 * 60;

const poolTracker = {};

let channel;

// reuses the same channel each time if it's alreay been initialized.

const getChannel = () => {
	return new Promise((resolve,reject) => {
		if (channel){
			resolve(channel);
		} else {
			mq
				.then((mqConn) => {
					return mqConn.createChannel();
				})
				.then((channelRequestResult) => {
					channel = channelRequestResult;
					resolve(channel);
				});
		}
	});
};

const getPools = () => {
	const pools = {};
	_.forEach(process.env, (value, key) => {
		if (key.startsWith('POOL_')){
			const properName = key.replace('POOL_', '');
			pools[properName] = value;
			if (!poolTracker[properName]){
				logger.debug(`intializing tracker for ${properName}`);
				poolTracker[properName] = {
					actual : null,
					enqueuedByMe : 0
				};
			}
		}
	});
	return pools;
};

const getActualQuantity = (poolname) => {
	return new Promise((resolve, reject) => {
		getChannel()
			.then((ch) => {
				return ch.assertQueue(poolname);
			})
			.then((q) => {
				if (poolTracker[poolname].actual === null){
					// we don't have a value for this one yet
					poolTracker[poolname].actual = q.messageCount;
					logger.debug(`initializing actual on the tracker for ${poolname}`);
				} else if (poolTracker[poolname].actual < q.messageCount){
					// there are some newly completed orgs
					const newOrgs = q.messageCount - poolTracker[poolname].actual;
					logger.debug(`there are ${newOrgs} new orgs I didn't know about for ${poolname}`);

					poolTracker[poolname].enqueuedByMe = Math.max(0, poolTracker[poolname].enqueuedByMe - newOrgs); // they must have been created from my queue
					poolTracker[poolname].actual = q.messageCount;
				} else if (poolTracker[poolname].actual > q.messageCount) {
					// someone's been eating my orgs, or they expired.  I'll update my count;
					logger.debug('some orgs I expected to see expired or were used.  Lowering my count');

					poolTracker[poolname].actual = q.messageCount;
				}

				resolve(q.messageCount);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const preparePoolByName = async (poolname) => {

	const targetQuantity = getPools()[poolname];
	const actualQuantity = await getActualQuantity(poolname);
	const inProgress = poolTracker[poolname].enqueuedByMe;

	logger.debug(`pool ${poolname} has ${actualQuantity} ready and ${inProgress} in progress out of ${targetQuantity}`);

	return new Promise( (resolve, reject) => {

		if (actualQuantity + inProgress < targetQuantity) {
			getChannel()
				.then((ch) => {
					resolve(`requesting 1 more org for ${poolname}`);

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

					ch.assertQueue('poolDeploys', { durable: true });
					ch.sendToQueue('poolDeploys', new Buffer(JSON.stringify(message)));
					poolTracker[poolname].enqueuedByMe = poolTracker[poolname].enqueuedByMe + 1;
				});
		} else {
			resolve(`pool ${poolname} is full`);
		}
	});


};


const prepareAll =  () => {
	const pools = getPools();
	_.forEach(pools, async (quantity, name) => {
		let result = await preparePoolByName(name);
		logger.debug(result);
	});
};


getChannel()
 .then(() => {
	 prepareAll();
	 setInterval(prepareAll, loopMills);
 });
