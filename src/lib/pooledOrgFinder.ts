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

import { deployRequest } from './types';

const pooledOrgFinder = async function(deployReq: deployRequest) {
	
	try {
		let cds = await getPooledOrg(await utilities.getKey(deployReq), true);
		cds = {...cds, buildStartTime: new Date(), deployId: deployReq.deployId, browserStartTime: deployReq.createdTimestamp || new Date() };

		const uniquePath = path.join(__dirname, '../tmp/pools', cds.orgId);
		fs.ensureDirSync(uniquePath);

		await execProm(
			// `sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${ cds.mainUser.username } --jwtkeyfile ${keypath} --instanceurl ${cds.instanceUrl || 'https://test.salesforce.com'} -s`,
			`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ cds.mainUser.username } --jwtkeyfile ${await getKeypath()} --instanceurl https://test.salesforce.com -s`,
			{ cwd: uniquePath }
		);
		
		// we may need to put the user's email on it
		if (deployReq.email) {
			logger.debug(`changing email to ${deployReq.email}`);
			await execProm(
				`sfdx force:data:record:update -s User -w "username='${cds.mainUser.username}'" -v "email='${
					deployReq.email
				}'"`,
				{ cwd: uniquePath }
			);			
		}

		let password: string;

		if (cds.poolLines.passwordLine) {
			const stripped = argStripper(cds.poolLines.passwordLine, '--json', true);
			const passwordSetResult = await execProm(`${stripped} --json`, {
				cwd: uniquePath
			});

			// may not have returned anything if it wasn't used
			if (passwordSetResult) {
				password = JSON.parse(stripcolor(passwordSetResult.stdout)).result.password;
				logger.debug(`password set to: ${password}`);
			}
		}

		const openResult = await execProm(`${cds.poolLines.openLine} --json -r`, {
			cwd: uniquePath
		});
		const openOutput = JSON.parse(stripcolor(openResult.stdout));

		cds.openTimestamp = new Date();
		cds.completeTimestamp = new Date();
		cds.mainUser = {
			...(cds.mainUser),
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