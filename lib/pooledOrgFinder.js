const logger = require('heroku-logger');
const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');
const fs = require('fs');
const path = require('path');
const exec = require('child-process-promise').exec;
const utilities = require('./utilities');
const argStripper = require('./argStripper');

const bufferKey = require('./bufferKey');

const deployMsgExchange = 'deployMsg';

let ch;

const getChannel = () => {
	return new Promise((resolve, reject) => {
		if (ch) {
			resolve(ch);
		} else {
			mq
				.then((mqConn) => {
					return mqConn.createChannel();
				})
				.then((channelRequestResult) => {
					ch = channelRequestResult;
					resolve(ch);
				});
		}
	});
};

module.exports = function (deployReq) {

		return new Promise((resolve) => {
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

			getChannel()
				.then((channel) => {
					logger.debug('channel established');
					ch = channel;
					ch.prefetch(1);  // only pull 1 message at a time from the queue
					return utilities.getKey(deployReq);
				})
				.then( (keyResult) => {
					logger.debug(`queue will be called ${keyResult}`);
					key = keyResult;
					return ch.assertQueue(key);
				})
				.then((q) => {
					logger.debug(`pool got a queue: ${q}`);
					// if there are no messages in the queue, let's quit now.
					if (q.messageCount === 0 ){
						logger.warn(`no queued orgs for ${key}`);
						resolve(false);
					}

					console.log('getting messages from the pool');

					return ch.consume(q.queue, (poolMsg) => {

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
								logger.debug(`auth completed ${loginResult.stdout}`);

								if (deployReq.email) {
									logger.debug(`changing email to ${deployReq.email}`);
									return exec(`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${deployReq.email}'"`, { 'cwd': uniquePath });
								}
								return false;
							})
							.then((emailResult) => {
								if (emailResult){
									logger.debug('updated email: emailResult.stdout');
								}
								if (msgJSON.passwordCommand){
									const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
									return exec(`${stripped} --json`, { 'cwd': uniquePath });
								}
								return false;
							})
							.then((passwordSetResult) => {
								// may not have returned anything if it wasn't used
								if (passwordSetResult){
									logger.debug(`password set results:  ${passwordSetResult.stdout}`);
									const usernameMessage = {
										result: {
											username: msgJSON.displayResults.username,
											orgId: msgJSON.displayResults.id
										}
									};
									const messages = Promise.all([
										ch.publish(deployMsgExchange, '', bufferKey(JSON.stringify(usernameMessage), deployReq.deployId)),
										ch.publish(deployMsgExchange, '', bufferKey(passwordSetResult.stdout, deployReq.deployId))
									]);
									return messages;
								} else {
									return false;
								}
							})
							.then(() => {
								return exec(`${msgJSON.openCommand} --json -r`, { 'cwd': uniquePath });
							})
							.then((result) => {
								openResult = result;
								logger.debug(`opened : ${openResult.stdout}`);
								return ch.assertExchange(deployMsgExchange, 'fanout', { durable: false });
							})
							.then(() => {
								// please don't send me any more messages
								return ch.cancel(consumerTag);
							})
							.then(() => {
								return ch.publish(deployMsgExchange, '', bufferKey(openResult.stdout, deployReq.deployId));
							})
							.then(() => {
								return ch.ack(poolMsg);
							})
							.then(() => {
								return ch.publish(deployMsgExchange, '', bufferKey('ALLDONE', deployReq.deployId));
							})
							.then(() => {
								resolve(true);
							})
							.catch((err) => {
								logger.error(err);
								ch.nack(poolMsg)
									.then(() => {
										ch.cancel(consumerTag);
									})
									.then(() => {
										resolve(false);
									});
							});
					}, { noAck: false })
					.then((consumerTagResult) => {
						consumerTag = consumerTagResult.consumerTag;
						logger.debug(`consumer tag is ${consumerTag}`);
					});
				})
				.catch((err) => {
					logger.error(`error in pool finder: ${err}`);
					resolve(false);
				});
			});
};
