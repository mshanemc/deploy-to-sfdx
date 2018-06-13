const util = require('util');
const fs = require('fs');
const logger = require('heroku-logger');
const path = require('path');
const utilities = require('./utilities');
const poolParse = require('./poolParse');
const hubAuth = require('./hubAuth');
const redis = require('./redisNormal');

const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);

const loggerFunction = (result) => {
	if (result.stdout) {
		logger.debug(result.stdout);
	}
	if (result.stderr) {
		logger.debug(result.stderr);
	}
};

logger.debug('I am a pool consumer and I am up!');

async function runAll(){


	const msg = await redis.lpop('poolDeploys');
	if (msg) {
		const keypath = await hubAuth();
		const msgJSON = JSON.parse(msg);
		// handling deletes
		if (msgJSON.delete) {
			logger.debug(`deleting org with username ${msgJSON.username}`);
			try {
				loggerFunction(await exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`));
				logger.debug('connected to the org');

				loggerFunction(await exec(`sfdx force:org:delete -p -u ${msgJSON.username}`));
				logger.debug('org deleted');
				process.exit(0);
			} catch (err){
				logger.error('failed to delete an org!');
				process.exit(1);
			}
		} else {
			// non-deletes
			logger.debug(msgJSON.deployId);
			const foundPool = await utilities.getPool(msgJSON.username, msgJSON.repo);

			if (!foundPool) {
				logger.warn(`request went to deployPools but not a pool repo: ${msgJSON.username}.${msgJSON.repo}`);
				// go back and build it the normal way!
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

				loggerFunction(await exec(gitCloneCmd, { 'cwd': tmpDir }));
				if (!fs.existsSync(`${cloneDir}/orgInit.sh`)) {
					logger.error('There is no orgInit.sh file in the repo');
					logger.debug(`${cloneDir}/orgInit.sh`);
					throw 'There is no orgInit.sh file in the repo';
				} else {
					logger.debug('orgInit exists!');
				}

				const parseResults = await (poolParse(path.join(cloneDir, 'orgInit.sh')));

				// a few things we have to do post-org-creation so we can still return it to the end user
				logger.debug(`open command is ${parseResults.openLine}`);
				poolMessage.openCommand = parseResults.openLine;
				if (parseResults.passwordLine) {
					poolMessage.passwordCommand = parseResults.passwordLine;
				}

				// run the file
				loggerFunction(await execFile('./orgInit.sh', { 'cwd': cloneDir, timeout: 1000000 }));
				const displayResults = await exec('sfdx force:org:display --json', { 'cwd': cloneDir });
				poolMessage.displayResults = JSON.parse(displayResults.stdout).result;
				const key = await utilities.getKey(msgJSON);
				poolMessage.createdDate = new Date();
				await redis.rpush(key, JSON.stringify(poolMessage));
				await exec(`rm -rf ${msgJSON.deployId}`, { 'cwd': tmpDir });
				process.exit(0);
			}
		}

	} else {
		logger.debug('nothing for me to do');
		process.exit(0);
	}

}

runAll();