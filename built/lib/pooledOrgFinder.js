"use strict";
const child_process_1 = require("child_process");
const logger = require("heroku-logger");
const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const utilities = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const hubAuth_1 = require("./hubAuth");
const argStripper = require("./argStripper");
const timeTracking_1 = require("./timeTracking");
const execProm = util.promisify(child_process_1.exec);
const pooledOrgFinder = async function (deployReq) {
    try {
        const msgJSON = await redisNormal_1.getPooledOrg(await utilities.getKey(deployReq), true);
        const cds = {
            deployId: deployReq.deployId,
            browserStartTime: deployReq.createdTimestamp || new Date(),
            buildStartTime: new Date(),
            complete: true,
            commandResults: [],
            errors: []
        };
        const uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);
        fs.ensureDirSync(uniquePath);
        const loginResult = await execProm(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.displayResults.username} --jwtkeyfile ${await hubAuth_1.getKeypath()} --instanceurl https://test.salesforce.com -s`, { cwd: uniquePath });
        logger.debug(`auth completed ${loginResult.stdout}`);
        if (deployReq.email) {
            logger.debug(`changing email to ${deployReq.email}`);
            const emailResult = await execProm(`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${deployReq.email}'"`, { cwd: uniquePath });
            if (emailResult) {
                logger.debug(`updated email: ${emailResult.stdout}`);
            }
        }
        let password;
        if (msgJSON.passwordCommand) {
            const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
            const passwordSetResult = await execProm(`${stripped} --json`, {
                cwd: uniquePath
            });
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
        await redisNormal_1.cdsPublish(cds);
        timeTracking_1.timesToGA(deployReq, cds);
        return true;
    }
    catch (e) {
        logger.warn('pooledOrgFinder', e);
        return false;
    }
};
module.exports = pooledOrgFinder;
