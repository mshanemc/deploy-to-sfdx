const logger = require('heroku-logger');
const Redis = require('ioredis');

const fs = require('fs');
const path = require('path');
const exec = require('child-process-promise').exec;
const utilities = require('./utilities');
const argStripper = require('./argStripper');

const bufferKey = require('./bufferKey');

const deployMsgChannel = 'deployMsg';

const redisPub = new Redis(process.env.REDIS_URL);
const redis = new Redis(process.env.REDIS_URL);


module.exports = function (deployReq) {

		return new Promise((resolve) => {
			let msgJSON;
			let openResult;
			let key;
			let uniquePath;

			const poolsPath = path.join(__dirname, '../tmp', 'pools');

			// is this a template that we prebuild?  Config is like "mshanemc/platformTrial = 4"
			const configName = `POOL_${deployReq.username}.${deployReq.repo}`;
			if (!process.env[configName] || !process.env[configName] > 0) {
				logger.debug('not a pooled repo');
				resolve(false); // go back and build it the normal way!
			}
			logger.debug('this is a pooled repo');

			utilities.getKey(deployReq)
				.then((keyResult) => {
					logger.debug(`queue will be called ${keyResult}`);
					key = keyResult;
					return redis.lpop(key);
				})
				.then((poolMsg) => {
					if (!poolMsg){
						logger.warn(`no queued orgs for ${key}`);
						resolve(false);
					} else {
						logger.debug('getting messages from the pool');
						msgJSON = JSON.parse(poolMsg);

						if (!fs.existsSync(poolsPath)) {
							fs.mkdirSync(poolsPath);
						}

						uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);
						if (!fs.existsSync(uniquePath)) {
							fs.mkdirSync(uniquePath);
						}

						const keypath = process.env.LOCAL_ONLY_KEY_PATH || '/app/tmp/server.key';

						// get a new session on that scratch org that we just found
						return exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.displayResults.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`, { 'cwd': uniquePath });
					}
				})
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
							redisPub.publish(deployMsgChannel, bufferKey(JSON.stringify(usernameMessage), deployReq.deployId)),
							redisPub.publish(deployMsgChannel, bufferKey(passwordSetResult.stdout, deployReq.deployId))
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
					return redisPub.publish(deployMsgChannel, bufferKey(openResult.stdout, deployReq.deployId));
				})
				.then(() => {
					return redisPub.publish(deployMsgChannel, bufferKey('ALLDONE', deployReq.deployId));
				})
				.then(() => {
					redis.disconnect();
					redisPub.disconnect();
					resolve(true);
				})
				.catch((err) => {
					logger.error(`error in pool finder: ${err}`);
					resolve(false);
				});

		});
};
