const logger = require('heroku-logger');
const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');
const fs = require('fs');
const path = require('path');
const exec = require('child-process-promise').exec;
const utilities = require('./utilities');
const argStripper = require('./argStripper');

const bufferKey = require('./bufferKey');

const deployMsgExchange = 'deployMsg';

module.exports = function (deployReq) {

	return new Promise((resolve) => {
		let ch;
		let key;
		let mqConn;
		let consumerTag;
		let openResult;

		// is this a template that we prebuild?  Config is like "mshanemc/platformTrial = 4"
		const configName = `POOL_${deployReq.username}.${deployReq.repo}`;
		if (!process.env[configName] || !process.env[configName] > 0) {
			logger.debug('not a pooled repo');
			resolve(false); // go back and build it the normal way!
		}
		logger.debug('this is a pooled repo');

		mq
			.then((mqConnResult) => {
				mqConn = mqConnResult;
				return mqConn.createChannel();
			})
			.then((channel) => {
				ch = channel;
				ch.prefetch(1);  // only pull 1 message at a time from the queue
				return utilities.getKey(deployReq);
			})
			.then( (keyResult) => {
				key = keyResult;
				return ch.assertQueue(key);
			})
			.then((q) => {

				// if there are no messages in the queue, let's quit now.
				if (q.messageCount === 0 ){
					logger.warn(`no queued orgs for ${key}`);
					mqConn.close();
					resolve(false);
				}

				console.log('getting messages from the pool');

				ch.consume(q.queue, (poolMsg) => {

					if (poolMsg && poolMsg.content){ // sanity check for crap messages?

						const msgJSON = JSON.parse(poolMsg.content.toString());
						const poolsPath = path.join(__dirname, '../tmp', 'pools');
						if (!fs.existsSync(poolsPath)){
							fs.mkdirSync(poolsPath);
						}

						const uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);
						if (!fs.existsSync(uniquePath)) {
							fs.mkdirSync(uniquePath);
						}

						const keypath = process.env.LOCAL_ONLY_KEY_PATH || '/app/tmp/server.key';
						exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.displayResults.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`, { 'cwd': uniquePath })
						.then((loginResult) => {
							logger.debug('auth completed');
							console.log(loginResult);
							if (msgJSON.passwordCommand){
								const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
								return exec(`${stripped} --json`);
							} else {
								return false;
							}
						})
						.then((passwordSetResult) => {
							// may not have returned if it wasn't used
							if (passwordSetResult){
								const usernameMessage = {
									result: {
										username: msgJSON.displayResults.username,
										orgId: msgJSON.displayResults.id
									}
								};
								ch.publish(deployMsgExchange, '', bufferKey(JSON.stringify(usernameMessage), deployReq.deployId));
								ch.publish(deployMsgExchange, '', bufferKey(passwordSetResult.stdout, deployReq.deployId));
							}
							if (deployReq.email){
								return exec(`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${deployReq.email}'"`);
							} else {
								return false;
							}
						})
						.then(() => exec(`${msgJSON.openCommand} --json -r`, { 'cwd': uniquePath }))
						.then((result) => {
							openResult = result;
							logger.debug('opened it');
							console.log(openResult);
							ch.assertExchange(deployMsgExchange, 'fanout', { durable: false }, (err, ok) => {
								if (err) {
									logger.error(err);
								}
								if (ok) {
									logger.debug(ok);
								}
							});
							// please don't send me any more messages
							return ch.cancel(consumerTag);
						})
						.then(() => {
							ch.publish(deployMsgExchange, '', bufferKey(openResult.stdout, deployReq.deployId));
							ch.ack(poolMsg);
							ch.publish(deployMsgExchange, '', bufferKey('ALLDONE', deployReq.deployId));
							resolve(true);
						})
						.catch((err) => {
							logger.error(err);
							ch.nack(poolMsg);
							ch.cancel(consumerTag);
							resolve(false);
						});
					}
				}, { noAck: false })
				.then((consumerTagResult) => {
					consumerTag = consumerTagResult.consumerTag;
					logger.debug(`consumer tag is ${consumerTag}`);
				});

			});
		});
};
