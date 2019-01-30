import { exec } from 'child_process';
import * as logger from 'heroku-logger';
import * as util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';

import * as utilities from './utilities';
import { getPooledOrg, cdsPublish } from './redisNormal';
import { getKeypath } from './hubAuth';
import * as argStripper from './argStripper';

import { deployRequest, clientDataStructure } from './types';

const execProm = util.promisify(exec);

const pooledOrgFinder = async function(deployReq: deployRequest) {
	// is this a template that we prebuild?  uses the utilities.getPoolConfig
	const foundPool = await utilities.getPool(deployReq.username, deployReq.repo);

	if (!foundPool) {
		logger.debug('not a pooled repo');
		return false; // go back and build it the normal way!
	}

	logger.debug('this is a pooled repo');

	try {
		const msgJSON = await getPooledOrg(await utilities.getKey(deployReq), true);

		const cds: clientDataStructure = {
			deployId: deployReq.deployId,
			browserStartTime: new Date(),
			complete: true,
			commandResults: [],
			errors: []
		};

		const uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);

		fs.ensureDirSync(uniquePath);

		// let's auth to the org from the pool
		const loginResult = await execProm(
			`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${
				msgJSON.displayResults.username
			} --jwtkeyfile ${await getKeypath()} --instanceurl https://test.salesforce.com -s`,
			{ cwd: uniquePath }
		);

		logger.debug(`auth completed ${loginResult.stdout}`);

		// we may need to put the user's email on it
		if (deployReq.email) {
			logger.debug(`changing email to ${deployReq.email}`);
			const emailResult = await execProm(
				`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${
					deployReq.email
				}'"`,
				{ cwd: uniquePath }
			);
			if (emailResult) {
				logger.debug(`updated email: ${emailResult.stdout}`);
			}
		}

		let password: string;

		if (msgJSON.passwordCommand) {
			const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
			const passwordSetResult = await execProm(`${stripped} --json`, {
				cwd: uniquePath
			});

			// may not have returned anything if it wasn't used
			if (passwordSetResult) {
				logger.debug(`password set results: ${passwordSetResult.stdout}`);
				password = JSON.parse(passwordSetResult.stdout).result.password;
			}
		}

		const openResult = await execProm(`${msgJSON.openCommand} --json -r`, {
			cwd: uniquePath
		});

		cds.openTimestamp = new Date();
		cds.completeTimestamp = new Date();
		cds.orgId = msgJSON.displayResults.id;
		cds.mainUser = {
			username: msgJSON.displayResults.username,
			loginUrl: utilities.urlFix(JSON.parse(openResult.stdout)).result.url,
			password
		};

		logger.debug(`opened : ${openResult.stdout}`);
		await cdsPublish(cds);

		return true;
	} catch (e) {
		logger.warn('pooledOrgFinder', e);
		return false;
	}
};

export = pooledOrgFinder;
