const exec = require('child-process-promise').exec;
const execFile = require('child-process-promise').execFile;
const cluster = require('cluster');
const util = require('util');
const fs = require('fs');
const logger = require('heroku-logger');
const path = require('path');
const utilities = require('./utilities');
const poolParse = require('./poolParse');
const hubAuth = require('./hubAuth');
const redis = require('./redisNormal');

const setTimeoutPromise = util.promisify(setTimeout);
const cycleTime = process.env.cycleTime || 20;
const WORKERS = process.env.WEB_CONCURRENCY || 1;


logger.debug('I am a pool consumer and I am up!');


function checkQueue(){
		let msgJSON;
		redis.lpop('poolDeploys')
			.then((msg) => {
				if (!msg){
					logger.debug('pool queue is empty');
					setTimeoutPromise(1000 * cycleTime)
					.then(() => {
						checkQueue();
					});
					return;
				}
				console.log(msg);
				msgJSON = JSON.parse(msg);

				logger.debug(msgJSON.deployId);

				const usernameRepo = `POOL_${msgJSON.username}.${msgJSON.repo}`;
				// is this a template that we prebuild?  Config is like "mshanemc/platformTrial = 4"
				if (!process.env[usernameRepo] || !process.env[usernameRepo] > 0) {
					logger.warn(`not a pool org ${usernameRepo}`);
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
					// console.log(`cloneDir is ${cloneDir}`);
					// console.log(`tmpDir is ${tmpDir}`);

					const poolMessage = {
						'repo': msgJSON.repo,
						'githubUsername': msgJSON.username,
						'openCommand': 'placeholder',
						'displayResults': 'placeholder'
					};
					if (msgJSON.branch) {
						poolMessage.branch = msgJSON.branch;
					}

					exec(gitCloneCmd, { 'cwd': tmpDir })
						.then(() => {
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
							if (parseResults.passwordLine) {
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
							// pool orgs expire after 12 hours?
							poolMessage.createdDate = new Date();
							return redis.rpush(key, JSON.stringify(poolMessage));
						})
						.then(() => {
							// clean up after a minute
							checkQueue();
							return setTimeoutPromise(1000 * 60, 'foobar');
						})
						.then(() => {
							exec(`rm -rf ${msgJSON.deployId}`, { 'cwd': tmpDir });
						})
						.catch((err) => {
							logger.error('Error (worker.js): ', err);
							exec(`cd tmp;rm -rf ${msgJSON.deployId}`);
							checkQueue();
						});
				}
		});
}

if (cluster.isMaster){
	logger.debug('pool consumer master is starting');
	hubAuth()
		.then(() => {
			for (let i = 0; i < WORKERS; i++) {
				logger.debug(`starting poolWorker ${i}`);
				cluster.fork();
			}
		})
		.catch((err) => {
			logger.error(err);
		});
} else {
	checkQueue();
}



