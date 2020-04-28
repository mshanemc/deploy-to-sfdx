import logger from 'heroku-logger';
import fs from 'fs-extra';
import * as path from 'path';
import { retry } from '@lifeomic/attempt';

import { buildJWTAuthCommand } from './hubAuth';
import { CDS } from './CDS';
import { utilities } from './utilities';
import { getPoolKey } from './namedUtilities';
import { getPooledOrg, cdsPublish } from './redisNormal';
import { timesToGA } from './timeTracking';
import { execProm, exec2JSON } from './execProm';
import { loginURL } from './loginURL';

import { DeployRequest } from './types';
import { processWrapper } from './processWrapper';
const retryOptions = { maxAttempts: 60, delay: 5000 };

const pooledOrgFinder = async function (deployReq: DeployRequest, forcePool = false): Promise<CDS> {
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

        const jwtComand = `${await buildJWTAuthCommand(cds.mainUser.username)} --instanceurl https://test.salesforce.com -s`;

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

        const openOutput = await exec2JSON(cds.poolLines.openLine, {
            cwd: uniquePath
        });
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
        return undefined;
    }
};

export { pooledOrgFinder };
