"use strict";
const util = require("util");
const fs = require("fs-extra");
const logger = require("heroku-logger");
const rmfr = require("rmfr");
const redisNormal_1 = require("./redisNormal");
const lineParse_1 = require("./lineParse");
const lineRunner = require("./lines");
const pooledOrgFinder = require("./pooledOrgFinder");
const utilities = require("./utilities");
const exec = util.promisify(require('child_process').exec);
const check = async () => {
    let msgJSON;
    try {
        msgJSON = await redisNormal_1.getDeployRequest(true);
    }
    catch (e) {
        return false;
    }
    if (msgJSON.visitor) {
        try {
            msgJSON.visitor.event('Deploy Request', msgJSON.template).send();
        }
        catch (e) {
            logger.warn('failed to send GA event');
        }
    }
    if (await pooledOrgFinder(msgJSON)) {
        logger.debug('deployQueueCheck: using a pooled org');
    }
    else {
        fs.ensureDirSync('tmp');
        const clientResult = {
            deployId: msgJSON.deployId,
            complete: false,
            errors: [],
            commandResults: [],
            additionalUsers: [],
            mainUser: {},
            browserStartTime: new Date()
        };
        const gitCloneCmd = utilities.getCloneCommand(msgJSON);
        try {
            const gitCloneResult = await exec(gitCloneCmd, { cwd: 'tmp' });
            logger.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
            clientResult.commandResults.push({
                command: gitCloneCmd,
                raw: gitCloneResult.stderr
            });
            await redisNormal_1.cdsPublish(clientResult);
        }
        catch (err) {
            logger.warn(`deployQueueCheck: bad repo--https://github.com/${msgJSON.username}/${msgJSON.repo}.git`);
            clientResult.errors.push({
                command: gitCloneCmd,
                error: err.stderr,
                raw: err
            });
            clientResult.complete = true;
            await redisNormal_1.cdsPublish(clientResult);
            return true;
        }
        if (msgJSON.email) {
            logger.debug('deployQueueCheck: write a file for custom email address', msgJSON);
            const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
            const configFileJSON = JSON.parse(fs.readFileSync(location, 'utf8'));
            configFileJSON.adminEmail = msgJSON.email;
            fs.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
        }
        logger.debug(`deployQueueCheck: going to look in the directory tmp/${msgJSON.deployId}/orgInit.sh`);
        if (!fs.existsSync(`tmp/${msgJSON.deployId}/orgInit.sh`)) {
            logger.debug('deployQueueCheck: no orgInit.sh.  Will use default');
            fs.writeFileSync(`tmp/${msgJSON.deployId}/orgInit.sh`, `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`);
        }
        const parsedLines = await lineParse_1.lineParse(msgJSON);
        const localLineRunner = new lineRunner(msgJSON, parsedLines, redisNormal_1.redis, clientResult);
        try {
            const output = await localLineRunner.runLines();
            timesToGA(msgJSON, output);
        }
        catch (e) {
            logger.error('deployQueueCheck: Deployment error', msgJSON);
            logger.error('deployQueueCheck: Deployment error', e);
            await redisNormal_1.deleteOrg(msgJSON.username);
        }
    }
    await rmfr(`tmp/${msgJSON.deployId}`);
    return true;
};
const timesToGA = (msgJSON, CDS) => {
    if (msgJSON.visitor) {
        try {
            msgJSON.visitor
                .event('deploy complete', msgJSON.template, 'deploytime', CDS.completeTimestamp.getTime() - CDS.browserStartTime.getTime())
                .send();
            msgJSON.visitor
                .event('deploy complete', msgJSON.template, 'opentime', CDS.openTimestamp.getTime() - CDS.browserStartTime.getTime())
                .send();
        }
        catch (e) {
            logger.warn('GA timestamps not firing', msgJSON);
        }
    }
};
module.exports = check;
