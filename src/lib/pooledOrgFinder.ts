import * as logger from 'heroku-logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as stripcolor from 'strip-color';

import * as utilities from './utilities';
import { getPooledOrg, cdsPublish } from './redisNormal';
import { getKeypath } from './hubAuth';
import * as argStripper from './argStripper';
import { timesToGA } from './timeTracking';
import { execProm } from '../lib/execProm';

import { deployRequest, clientDataStructure } from './types';


const pooledOrgFinder = async function(deployReq: deployRequest) {
	
	try {
		const msgJSON = await getPooledOrg(await utilities.getKey(deployReq), true);

		const cds: clientDataStructure = {
			deployId: deployReq.deployId,
			browserStartTime: deployReq.createdTimestamp || new Date(),
			buildStartTime: new Date(),
			complete: true,
			commandResults: [],
			errors: []
		};

		const uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);

		fs.ensureDirSync(uniquePath);

		const keypath = await getKeypath();

		await execProm(
			`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${
				msgJSON.displayResults.username
			} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`,
			{ cwd: uniquePath }
		);
		
		// we may need to put the user's email on it
		if (deployReq.email) {
			logger.debug(`changing email to ${deployReq.email}`);
			const emailResult = await execProm(
				`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${
					deployReq.email
				}'"`,
				{ cwd: uniquePath }
			);			
		}

		let password: string;

		if (msgJSON.passwordCommand) {
			const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
			const passwordSetResult = await execProm(`${stripped} --json`, {
				cwd: uniquePath
			});

			// may not have returned anything if it wasn't used
			if (passwordSetResult) {
				password = JSON.parse(stripcolor(passwordSetResult.stdout)).result.password;
				logger.debug(`password set to: ${password}`);
			}
		}

		const openResult = await execProm(`${msgJSON.openCommand} --json -r`, {
			cwd: uniquePath
		});
		const openOutput = JSON.parse(stripcolor(openResult.stdout));

		cds.openTimestamp = new Date();
		cds.completeTimestamp = new Date();
		cds.orgId = msgJSON.displayResults.id;
		cds.mainUser = {
			username: msgJSON.displayResults.username,
			loginUrl: utilities.urlFix(openOutput).result.url,
			password
		};

		logger.debug(`opened : ${openOutput}`);
		await cdsPublish(cds);
		timesToGA(deployReq, cds);
		return cds;
	} catch (e) {
		logger.warn('pooledOrgFinder');
		logger.warn(e);
		return null;
	}
};

export { pooledOrgFinder };