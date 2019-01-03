"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const fs = require("fs-extra");
const logger = require("heroku-logger");
const path = require("path");
const utilities = require("./utilities");
const poolParse = require("./poolParse");
const hubAuth = require("./hubAuth");
const redis = require("./redisNormal");
const exec = util.promisify(require('child_process').exec);
const execFile = util.promisify(require('child_process').execFile);
async function poolBuild() {
    const msg = await redis.lpop('poolDeploys');
    if (msg) {
        const keypath = await hubAuth();
        const msgJSON = JSON.parse(msg);
        if (msgJSON.delete) {
            logger.debug(`deleting org with username ${msgJSON.username}`);
            try {
                utilities.loggerFunction(await exec(`sfdx force:auth:jwt:grant --json --clientid ${process.env.CONSUMERKEY} --username ${msgJSON.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`));
                logger.debug('connected to the org');
                utilities.loggerFunction(await exec(`sfdx force:org:delete -p -u ${msgJSON.username}`));
                logger.debug('org deleted');
                return true;
            }
            catch (err) {
                logger.error('failed to delete an org!', err);
                logger.error('failed to delete an org!', msgJSON);
                return false;
            }
        }
        else {
            logger.debug(msgJSON.deployId);
            logger.debug('building a pool org!');
            let gitCloneCmd = `git clone https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
            if (msgJSON.branch) {
                gitCloneCmd = `git clone -b ${msgJSON.branch} --single-branch https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
            }
            const cloneDir = path.join(__dirname, '../tmp', msgJSON.deployId);
            const tmpDir = path.join(__dirname, '../tmp');
            fs.ensureDirSync(tmpDir);
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
                logger.error('There is no orgInit.sh file in the repo');
                logger.debug(`${cloneDir}/orgInit.sh`);
                throw 'There is no orgInit.sh file in the repo';
            }
            else {
                logger.debug('orgInit exists!');
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
                const key = await utilities.getKey(msgJSON);
                await redis.rpush(key, JSON.stringify(poolMessage));
                await exec(`rm -rf ${msgJSON.deployId}`, { cwd: tmpDir });
                return true;
            }
            catch (error) {
                logger.error(`error runnning file for ${msgJSON.username}/${msgJSON.repo}`, error);
                return false;
            }
        }
    }
    else {
        logger.debug('nothing for me to do');
        return false;
    }
}
exports.poolBuild = poolBuild;
