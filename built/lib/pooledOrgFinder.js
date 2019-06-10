"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const fs = require("fs-extra");
const path = require("path");
const stripcolor = require("strip-color");
const utilities = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const hubAuth_1 = require("./hubAuth");
const argStripper = require("./argStripper");
const timeTracking_1 = require("./timeTracking");
const execProm_1 = require("../lib/execProm");
const pooledOrgFinder = async function (deployReq) {
    try {
        let cds = await redisNormal_1.getPooledOrg(await utilities.getKey(deployReq), true);
        cds = Object.assign({}, cds, { buildStartTime: new Date(), deployId: deployReq.deployId, browserStartTime: deployReq.createdTimestamp || new Date() });
        const uniquePath = path.join(__dirname, '../tmp/pools', cds.orgId);
        fs.ensureDirSync(uniquePath);
        await execProm_1.execProm(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${cds.mainUser.username} --jwtkeyfile ${await hubAuth_1.getKeypath()} --instanceurl https://test.salesforce.com -s`, { cwd: uniquePath });
        if (deployReq.email) {
            logger.debug(`changing email to ${deployReq.email}`);
            await execProm_1.execProm(`sfdx force:data:record:update -s User -w "username='${cds.mainUser.username}'" -v "email='${deployReq.email}'"`, { cwd: uniquePath });
        }
        let password;
        if (cds.poolLines.passwordLine) {
            const stripped = argStripper(cds.poolLines.passwordLine, '--json', true);
            const passwordSetResult = await execProm_1.execProm(`${stripped} --json`, {
                cwd: uniquePath
            });
            if (passwordSetResult) {
                password = JSON.parse(stripcolor(passwordSetResult.stdout)).result.password;
                logger.debug(`password set to: ${password}`);
            }
        }
        const openResult = await execProm_1.execProm(`${cds.poolLines.openLine} --json -r`, {
            cwd: uniquePath
        });
        const openOutput = JSON.parse(stripcolor(openResult.stdout));
        cds.openTimestamp = new Date();
        cds.completeTimestamp = new Date();
        cds.mainUser = Object.assign({}, (cds.mainUser), { loginUrl: utilities.urlFix(openOutput).result.url, password });
        logger.debug(`opened : ${openOutput}`);
        await redisNormal_1.cdsPublish(cds);
        timeTracking_1.timesToGA(deployReq, cds);
        return cds;
    }
    catch (e) {
        logger.warn('pooledOrgFinder');
        logger.warn(e);
        return null;
    }
};
exports.pooledOrgFinder = pooledOrgFinder;
