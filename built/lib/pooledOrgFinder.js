"use strict";
const logger = require("heroku-logger");
const util = require("util");
const fs = require("fs-extra");
const path = require("path");
const utilities = require("./utilities");
const redis = require("./redisNormal");
const argStripper = require("./argStripper");
const exec = util.promisify(require('child_process').exec);
const deployMsgChannel = 'deployMsg';
const pooledOrgFinder = async function (deployReq) {
    const foundPool = await utilities.getPool(deployReq.username, deployReq.repo);
    if (!foundPool) {
        logger.debug('not a pooled repo');
        return false;
    }
    logger.debug('this is a pooled repo');
    const key = await utilities.getKey(deployReq);
    logger.debug(`queue will be called ${key}`);
    const poolMsg = await redis.lpop(key);
    if (!poolMsg) {
        logger.warn(`no queued orgs for ${key}`);
        return false;
    }
    logger.debug('getting messages from the pool');
    const msgJSON = JSON.parse(poolMsg);
    const cds = {
        deployId: deployReq.deployId,
        browserStartTime: new Date(),
        complete: true,
        commandResults: [],
        errors: []
    };
    const uniquePath = path.join(__dirname, '../tmp/pools', msgJSON.displayResults.id);
    fs.ensureDirSync(uniquePath);
    const keypath = process.env.LOCAL_ONLY_KEY_PATH || '/app/tmp/server.key';
    const loginResult = await exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.displayResults.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`, { cwd: uniquePath });
    logger.debug(`auth completed ${loginResult.stdout}`);
    if (deployReq.email) {
        logger.debug(`changing email to ${deployReq.email}`);
        const emailResult = await exec(`sfdx force:data:record:update -s User -w "username='${msgJSON.displayResults.username}'" -v "email='${deployReq.email}'"`, { cwd: uniquePath });
        if (emailResult) {
            logger.debug(`updated email: ${emailResult.stdout}`);
        }
    }
    let password;
    if (msgJSON.passwordCommand) {
        const stripped = argStripper(msgJSON.passwordCommand, '--json', true);
        const passwordSetResult = await exec(`${stripped} --json`, {
            cwd: uniquePath
        });
        if (passwordSetResult) {
            logger.debug(`password set results: ${passwordSetResult.stdout}`);
            password = JSON.parse(passwordSetResult.stdout).password;
        }
    }
    const openResult = await exec(`${msgJSON.openCommand} --json -r`, {
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
    await redis.publish(deployMsgChannel, JSON.stringify(cds));
    return true;
};
module.exports = pooledOrgFinder;
