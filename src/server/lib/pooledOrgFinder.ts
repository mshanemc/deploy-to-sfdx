import logger from 'heroku-logger';
import fs from 'fs-extra';
import * as path from 'path';
import { retry } from '@lifeomic/attempt';

import { utilities } from './utilities';
import { getPoolKey } from './namedUtilities';
import { getPooledOrg, cdsPublish } from './redisNormal';
import { getKeypath } from './hubAuth';
import { timesToGA } from './timeTracking';
import { execProm, exec2JSON } from './execProm';
import { loginURL } from './loginURL';

import { DeployRequest } from './types';
import { processWrapper } from './processWrapper';
const retryOptions = { maxAttempts: 60, delay: 5000 };

const pooledOrgFinder = async function(deployReq: DeployRequest, forcePool = false) {
    try {
        if (!processWrapper.POOLCONFIG_URL && !forcePool) {
            return undefined; // not set up for pools, exit quickly
        }

        let cds = await getPooledOrg(getPoolKey(deployReq), true);
        cds = {
            ...cds,
            buildStartTime: new Date(),
            deployId: deployReq.deployId,
            browserStartTime: deployReq.createdTimestamp || new Date(),
            complete: false,
            isPool: false
        };

        const uniquePath = path.join(__dirname, '../tmp/pools', cds.orgId);
        await Promise.all([cdsPublish(cds), fs.ensureDir(uniquePath)]);

        // `sfdx force:auth:jwt:grant --json --clientid ${processWrapper.CONSUMERKEY} --username ${ cds.mainUser.username } --jwtkeyfile ${keypath} --instanceurl ${cds.instanceUrl || 'https://test.salesforce.com'} -s`,
        const jwtComand = `sfdx force:auth:jwt:grant --clientid ${processWrapper.CONSUMERKEY} --username ${
            cds.mainUser.username
        } --jwtkeyfile ${await getKeypath()} --instanceurl https://test.salesforce.com -s`;

        if (forcePool) {
            await retry(async () => execProm(jwtComand, { cwd: uniquePath }), retryOptions);
        } else {
            await execProm(jwtComand, { cwd: uniquePath });
        }

        // we may need to put the user's email on it
        if (deployReq.email) {
            logger.debug(`changing email to ${deployReq.email}`);
            await execProm(`sfdx force:data:record:update -s User -w "username='${cds.mainUser.username}'" -v "email='${deployReq.email}'"`, {
                cwd: uniquePath
            });
        }

        const openOutput = await exec2JSON(`${cds.poolLines.openLine} --json -r`, {
            cwd: uniquePath
        });

        // cds.openTimestamp = new Date();
        // cds.completeTimestamp = new Date();
        // cds.mainUser = {
        //     ...cds.mainUser,
        //     loginUrl: utilities.urlFix(openOutput).result.url
        // };
        // cds.mainUser.permalink = loginURL(cds);
        // cds.complete = true;
        cds = {
            ...cds,
            complete: true,
            openTimestamp: new Date(),
            completeTimestamp: new Date(),
            mainUser: {
                ...cds.mainUser,
                permalink: loginURL(cds),
                loginUrl: utilities.urlFix(openOutput).result.url
            }
        };
        logger.debug(`opened : ${openOutput}`);
        await Promise.all([cdsPublish(cds), timesToGA(deployReq, cds)]);

        return cds;
    } catch (e) {
        logger.warn('pooledOrgFinder');
        logger.warn(e);
        return null;
    }
};

export { pooledOrgFinder };
