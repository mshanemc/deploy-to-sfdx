import { exec } from 'child_process';
import * as logger from 'heroku-logger';
import * as delay from 'delay';
import * as util from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as stripcolor from 'strip-color';

import * as utilities from './utilities';
import { getPooledOrg, cdsPublish } from './redisNormal';
import { getKeypath } from './hubAuth';
import * as argStripper from './argStripper';
import { timesToGA } from './timeTracking';

import { deployRequest, clientDataStructure } from './types';

const execProm = util.promisify(exec);
const maxRetries = 300;

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

		let keepTrying = true;
		let authD = false;
		let tries = 0;

		while (!authD && keepTrying && tries < maxRetries) {
			// let's auth to the org from the pool
			tries++;
			try {
				const loginResult = await execProm(
					`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${
						msgJSON.displayResults.username
					} --jwtkeyfile ${await getKeypath()} --instanceurl https://test.salesforce.com -s`,
					{ cwd: uniquePath }
				);

				logger.debug(`auth completed ${loginResult.stdout}`);
				authD = true;
				keepTrying = false;
			} catch (err) {
				const parsedOut = JSON.parse(stripcolor(err.stdout));
				if (parsedOut.message.includes('This org appears to have a problem with its OAuth configuration')) {
					keepTrying = true;
				} else if (parsedOut.message.includes('This command requires a scratch org username set either with a flag or by default in the config.')) {
					keepTrying = true;
				} else {
					logger.error(parsedOut);
					keepTrying = false;
				}
				await delay.default(1000);
			}


		}
		
		if (!authD){
			throw new Error('unable to get authenticated to the org from the pool');
		}

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