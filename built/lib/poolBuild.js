"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const fs = require("fs-extra");
const logger = require("heroku-logger");
const path = require("path");
const rmfr = require("rmfr");
const utilities = require("./utilities");
const poolParse = require("./poolParse");
const hubAuth_1 = require("./hubAuth");
const redisNormal_1 = require("./redisNormal");
const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);
async function poolBuild() {
    const msgJSON = await redisNormal_1.getPoolRequest(true);
    await hubAuth_1.auth();
    if (msgJSON.delete) {
        await handleOrgDelete(msgJSON);
    }
    else {
        logger.debug('building a pool org!', msgJSON);
        const gitCloneCmd = utilities.getCloneCommand(msgJSON);
        const cloneDir = path.join(__dirname, '../tmp', msgJSON.deployId);
        const tmpDir = path.join(__dirname, '../tmp');
        fs.ensureDirSync(cloneDir);
        const poolMessage = {
            repo: msgJSON.repo,
            githubUsername: msgJSON.username,
            openCommand: 'placeholder',
            createdDate: new Date()
        };
        if (msgJSON.branch) {
            poolMessage.branch = msgJSON.branch;
        }
        utilities.loggerFunction(await exec(gitCloneCmd, { cwd: tmpDir }));
        if (!fs.existsSync(`${cloneDir}/orgInit.sh`)) {
            logger.error('There is no orgInit.sh file in the repo', msgJSON);
            throw new Error('There is no orgInit.sh file in the repo');
        }
        const parseResults = await poolParse(path.join(cloneDir, 'orgInit.sh'));
        logger.debug(`open command is ${parseResults.openLine}`);
        poolMessage.openCommand = parseResults.openLine;
        if (parseResults.passwordLine) {
            poolMessage.passwordCommand = parseResults.passwordLine;
        }
        try {
            utilities.loggerFunction(await execFile('./orgInit.sh', { cwd: cloneDir, timeout: 1000000 }));
            const displayResults = await exec('sfdx force:org:display --json', {
                cwd: cloneDir
            });
            poolMessage.displayResults = JSON.parse(displayResults.stdout).result;
            await redisNormal_1.putPooledOrg(msgJSON, poolMessage);
            await rmfr(`${tmpDir}/${msgJSON.deployId}`);
            return true;
        }
        catch (error) {
            logger.error(`error runnning file for ${msgJSON.username}/${msgJSON.repo}`, error);
            await rmfr(`${tmpDir}/${msgJSON.deployId}`);
            return false;
        }
    }
}
exports.poolBuild = poolBuild;
const handleOrgDelete = async (depReq) => {
    logger.debug(`deleting org with username ${depReq.username}`);
    try {
        utilities.loggerFunction(await exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${depReq.username} --jwtkeyfile ${await hubAuth_1.getKeypath()} --instanceurl https://test.salesforce.com -s`));
        logger.debug('connected to the org');
        utilities.loggerFunction(await exec(`sfdx force:org:delete -p -u ${depReq.username}`));
        logger.debug('org deleted');
        return true;
    }
    catch (err) {
        logger.error('failed to delete an org!', err);
        logger.error('failed to delete an org!', depReq);
        return false;
    }
};
