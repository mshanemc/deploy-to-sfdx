import * as logger from 'heroku-logger';
import * as util from 'util';
import * as fs from 'fs';
import * as path from 'path';

import * as utilities from './utilities';
import * as redis from './redisNormal';
import * as argStripper from './argStripper';

const exec = util.promisify(require('child_process').exec);


const deployMsgChannel = 'deployMsg';


const pooledOrgFinder = async function (deployReq) {

	const poolsPath = path.join(__dirname, '../tmp', 'pools');

	// is this a template that we prebuild?  uses the utilities.getPoolConfig
	const foundPool = await utilities.getPool(deployReq.username, deployReq.repo);

	if (!foundPool){
		logger.debug('not a pooled repo');
		return false; // go back and build it the normal way!
	}

	logger.debug('this is a pooled repo');

	const key =	await utilities.getKey(deployReq);
	logger.debug(`queue will be called ${key}`);
	const poolMsg = await redis.lpop(key);

	if (!poolMsg){
		logger.warn(`no queued orgs for ${key}`);
		return false;
	}

	logger.debug('getting messages from the pool');
	const msgJSON = JSON.parse(poolMsg);

	if (!fs.existsSync(poolsPath)) {
		fs.mkdirSync(poolsPath);
	}

	const uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);
	if (!fs.existsSync(uniquePath)) {
		fs.mkdirSync(uniquePath);
	}

	const keypath = process.env.LOCAL_ONLY_KEY_PATH || '/app/tmp/server.key';

	const loginResult = await exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.displayResults.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`, { 'cwd': uniquePath });

	logger.debug(`auth completed ${loginResult.stdout}`);

	if (deployReq.email) {
		logger.debug(`changing email to ${deployReq.email}`);
		const emailResult = await exec(`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${deployReq.email}'"`, { 'cwd': uniquePath });
		if (emailResult){
			logger.debug(`updated email: ${emailResult.stdout}`);
		}
	}

	if (msgJSON.passwordCommand){
		const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
		const passwordSetResult = await exec(`${stripped} --json`, { 'cwd': uniquePath });

		// may not have returned anything if it wasn't used
		if (passwordSetResult) {
			logger.debug(`password set results:  ${passwordSetResult.stdout}`);
			const usernameMessage = {
				result: {
					username: msgJSON.displayResults.username,
					orgId: msgJSON.displayResults.id
				}
			};
			await Promise.all([
				redis.publish(deployMsgChannel, utilities.bufferKey(JSON.stringify(usernameMessage), deployReq.deployId)),
				redis.publish(deployMsgChannel, utilities.bufferKey(passwordSetResult.stdout, deployReq.deployId))
			]);
		}
	}

	const openResult = await exec(`${msgJSON.openCommand} --json -r`, { 'cwd': uniquePath });
	logger.debug(`opened : ${openResult.stdout}`);
	await redis.publish(deployMsgChannel, utilities.bufferKey(openResult.stdout, deployReq.deployId));
	await redis.publish(deployMsgChannel, utilities.bufferKey('ALLDONE', deployReq.deployId));

	return true;
};

export = pooledOrgFinder;