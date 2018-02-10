const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');

const exec = require('child-process-promise').exec;
const execFile = require('child-process-promise').execFile;
const util = require('util');
const fs = require('fs');
const logger = require('heroku-logger');
const path = require('path');
const utilities = require('./utilities');
const poolParse = require('./poolParse');

const setTimeoutPromise = util.promisify(setTimeout);
const poolOrgLifeLimit = (1000 * 60 * 60 * 12).toString();

module.exports = function () {
	mq
		.then((mqConn) => {
			return mqConn.createChannel();
		})
		.then((ch) => {
			// deploy requests are received on this queue
			ch.assertQueue('poolDeploys', { durable: true });

			// this consumer eats deploys, creates local folders, and chops up the tasks into steps
			ch.consume('poolDeploys', (msg) => {
				// logger.debug(msg);
				const msgJSON = JSON.parse(msg.content.toString());
				logger.debug(msgJSON);
				logger.debug(msgJSON.deployId);
				logger.debug(msgJSON.template);

				const usernameRepo = `POOL_${msgJSON.username}.${msgJSON.repo}`;
				// is this a template that we prebuild?  Config is like "mshanemc/platformTrial = 4"
				if (!process.env[usernameRepo] || !process.env[usernameRepo] > 0) {
					logger.error('repo requested for pool is not in the pooled list of config variables');
					ch.ack(msg);
				} else {
					logger.debug('building a pool org!');

					// clone repo into local fs
					// checkout only the specified branch, if specified
					let gitCloneCmd = `git clone https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;

					// special handling for branches
					if (msgJSON.branch) {
						// logger.debug('It is a branch!');
						gitCloneCmd = `git clone -b ${msgJSON.branch} --single-branch https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
						// logger.debug(gitCloneCmd);
					}
					const cloneDir = path.join(__dirname, '../tmp', msgJSON.deployId);
					const tmpDir = path.join(__dirname, '../tmp');
					console.log(`cloneDir is ${cloneDir}`);
					console.log(`tmpDir is ${tmpDir}`);

					let poolMessage = {
						'repo': msgJSON.repo,
						'githubUsername': msgJSON.username,
						'openCommand': 'placeholder',
						'displayResults': 'placeholder'
					};
					if (msgJSON.branch) {
						poolMessage.branch = msgJSON.branch;
					}

					exec(gitCloneCmd, { 'cwd': tmpDir })
						.then((result) => {
							// git outputs to stderr for unfathomable reasons
							// logger.debug(result.stderr);
							return exec('ls', { 'cwd': cloneDir });
						})
						.then((result) => {
							// logger.debug(result.stdout);
							if (!fs.existsSync(`${cloneDir}/orgInit.sh`)) {
								logger.error('There is no orgInit.sh file in the repo');
								logger.debug(`${cloneDir}/orgInit.sh`);
								throw 'There is no orgInit.sh file in the repo';
							} else {
								logger.debug('orgInit exists!');
							}
							return poolParse(path.join(cloneDir, 'orgInit.sh'));
						})
						.then((parseResults) => {
							// a few things we have to do post-org-creation so we can still return it to the end user
							console.log(`open command is ${parseResults.openLine}`);
							poolMessage.openCommand = parseResults.openLine;
							if (parseResults.passwordLine){
								poolMessage.passwordCommand = parseResults.passwordLine;
							}
							// run the file
							return execFile('./orgInit.sh', { 'cwd': cloneDir });
						})
						.then((execFileResult) => {
							logger.debug(execFileResult);
							logger.debug(execFileResult.stderr);
							logger.debug(execFileResult.stdout);

							return exec('sfdx force:org:display --json', { 'cwd': cloneDir });
						})
						.then((displayResults) => {
							// get the orgusername
							console.log(displayResults.stdout);
							poolMessage.displayResults = JSON.parse(displayResults.stdout).result;
							console.log(poolMessage);
							return utilities.getKey(msgJSON);
						})
						.then((key) => {
							ch.assertQueue(key, { durable: true });
							// pool orgs expire after 12 hours?
							ch.sendToQueue(key, new Buffer(JSON.stringify(poolMessage)), { expiration: poolOrgLifeLimit });

							ch.ack(msg);
							// clean up after a minute
							return setTimeoutPromise(1000 * 60, 'foobar');
						})
						.then(() => {
							exec(`rm -rf ${msgJSON.deployId}`, { 'cwd': tmpDir });
						})
						.catch((err) => {
							logger.error('Error (worker.js): ', err);
							ch.ack(msg);
							exec(`cd tmp;rm -rf ${msgJSON.deployId}`);
						});
					}

			}, { noAck: false });
		});


};
