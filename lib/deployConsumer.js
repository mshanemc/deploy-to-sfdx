const cluster = require('cluster');

const exec = require('child-process-promise').exec;
const util = require('util');
const ua = require('universal-analytics');
const fs = require('fs');
const logger = require('heroku-logger');

const logResult = require('./logging');
const bufferKey = require('./bufferKey');
const lineParse = require('./lineParse');
const lineRunner = require('./lines');
const pooledOrgFinder = require('./pooledOrgFinder');

const cycleTime = process.env.cycleTime || 20;
const WORKERS = process.env.WEB_CONCURRENCY || 1;

const ex = 'deployMsg';
const setTimeoutPromise = util.promisify(setTimeout);

const redis = require('./redisNormal');

const hubAuth = require('./hubAuth');


logger.debug('I am a deploy (non-pool) consumer and I am up!');

function checkQueue(){
	// pull the oldest thing on the queue
	let msgJSON;
	redis.lpop('deploys')
		.then((msg) => {
			// if it's empty, sleep a while and check again
			if (!msg){
				// logger.debug('queue is empty');
				setTimeoutPromise(1000 * cycleTime)
				.then(() => {
					checkQueue();
				});
			} else {
				console.log(msg);

				msgJSON = JSON.parse(msg);

				if (msgJSON.delete) {
					logger.debug(`deleting org with username ${msgJSON.username}`);
					exec(`sfdx force:org:delete -u ${msgJSON.username}`)
					.then(() => {
						logger.debug('org deleted');
						checkQueue();
					})
					.catch((e) => {
						logger.error(e);
						checkQueue();
					})
				} else {
					const visitor = ua(process.env.UA_ID || 0);

					// logger.debug(msg);
					logger.debug(msgJSON);
					logger.debug(msgJSON.deployId);
					logger.debug(msgJSON.template);
					visitor.event('Deploy Request', msgJSON.template).send();

					pooledOrgFinder(msgJSON)
						.then((result) => {
							if (result) {
								console.log('found a usable org');
								// already published appropriate messages for the page to handle from the pooledOrgFinder
								throw new Error('Used a Pool');	// throw an error to break out of the rest of the promise chain and ack
							} else {
								// checkout only the specified branch, if specified
								let gitCloneCmd = `cd tmp;git clone https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;

								// special handling for branches

								if (msgJSON.branch) {
									// logger.debug('It is a branch!');
									gitCloneCmd = `cd tmp;git clone -b ${msgJSON.branch} --single-branch https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
									// logger.debug(gitCloneCmd);
								}
								return exec(gitCloneCmd);
							}
						})
						.then((result) => {
							// git outputs to stderr for unfathomable reasons
							logger.debug(result.stderr);
							redis.publish(ex, bufferKey(result.stderr, msgJSON.deployId));
							return true;
						})
						.then(() => {
							// if you passed in a custom email address, we need to edit the config file and add the adminEmail property
							if (msgJSON.email) {
								console.log('write a file for custom email address');
								const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
								const configFileJSON = JSON.parse(fs.readFileSync(location, 'utf8'));
								configFileJSON.adminEmail = msgJSON.email;
								fs.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
								return true;
							} else {
								return true;
							}
						})
						.then((result) => {
							logResult(result);
							// grab the deploy script from the repo
							logger.debug(`going to look in the directory tmp/${msgJSON.deployId}/orgInit.sh`);

							// use the default file if there's not one
							if (!fs.existsSync(`tmp/${msgJSON.deployId}/orgInit.sh`)) {
								const parsedLines = [];
								logger.debug('no orgInit.sh.  Will use default');
								parsedLines.push(`cd tmp;cd ${msgJSON.deployId};sfdx force:org:create -f config/project-scratch-def.json -s -d 1`);
								parsedLines.push(`cd tmp;cd ${msgJSON.deployId};sfdx force:source:push`);
								parsedLines.push(`cd tmp;cd ${msgJSON.deployId};sfdx force:org:open`);
								return parsedLines;
							} else { // read the lines
								logger.debug('found a orgInit.sh');
								return lineParse(msgJSON, visitor);
							}
						})
						.then((parsedLines) => {
							logger.debug('these are the parsed lines:');
							logger.debug(parsedLines);
							// some kind of error occurred, already handled
							if (!parsedLines) {
								logger.error('line parsing failed');
							} else {
								logger.debug('got back parsed lines');
								let localLineRunner = new lineRunner(msgJSON, parsedLines, redis, visitor);
								return localLineRunner.runLines();
							}
						})
						.then(() => {
							// this is true whether we errored or not
							redis.publish(ex, bufferKey('ALLDONE', msgJSON.deployId));
							visitor.event('deploy complete', msgJSON.template).send();

							// clean up after a minute
							return setTimeoutPromise(1000 * 60, 'foobar');
						})
						.then(() => {
							exec(`cd tmp;rm -rf ${msgJSON.deployId}`);
						})
						.then((cleanResult) => {
							logResult(cleanResult);
						})
						.then(() => checkQueue())
						.catch((err) => {
							logger.error('Error (worker.js): ', err);
							exec(`cd tmp;rm -rf ${msgJSON.deployId}`);
						})
						.then(() => checkQueue());
					}

				}
		});

}

if (cluster.isMaster) {
	logger.debug('deploy consumer master is starting');
	hubAuth()
		.then(() => {
			for (let i = 0; i < WORKERS; i++) {
				logger.debug(`starting deploy Worker ${i}`);
				cluster.fork();
			}
		})
		.catch((err) => {
			logger.error(err);
		});
} else {
	checkQueue();
}