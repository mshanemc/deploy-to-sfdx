"use strict";
const util = require("util");
const ua = require("universal-analytics");
const fs = require("fs-extra");
const logger = require("heroku-logger");
const redis = require("./redisNormal");
const lineParse = require("./lineParse");
const lineRunner = require("./lines");
const pooledOrgFinder = require("./pooledOrgFinder");
const exec = util.promisify(require('child_process').exec);
const ex = 'deployMsg';
const check = async () => {
    const msg = await redis.lpop('deploys');
    if (!msg) {
        return false;
    }
    const msgJSON = JSON.parse(msg);
    const visitor = ua(process.env.UA_ID || '0');
    logger.debug(msgJSON.deployId, msgJSON);
    visitor.event('Deploy Request', msgJSON.template).send();
    const pooledOrg = await pooledOrgFinder(msgJSON);
    if (pooledOrg) {
        logger.debug('using a pooled org');
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
        let gitCloneCmd = `git clone https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
        if (msgJSON.branch) {
            gitCloneCmd = `git clone -b ${msgJSON.branch} --single-branch https://github.com/${msgJSON.username}/${msgJSON.repo}.git ${msgJSON.deployId}`;
        }
        try {
            const gitCloneResult = await exec(gitCloneCmd, { cwd: 'tmp' });
            logger.debug(gitCloneResult.stderr);
            clientResult.commandResults.push({
                command: gitCloneCmd,
                raw: gitCloneResult.stderr
            });
            await redis.publish(ex, JSON.stringify(clientResult));
        }
        catch (err) {
            logger.warn(`bad repo: https://github.com/${msgJSON.username}/${msgJSON.repo}.git`);
            clientResult.errors.push({
                command: gitCloneCmd,
                error: err.stderr,
                raw: err
            });
            clientResult.complete = true;
            await redis.publish(ex, JSON.stringify(clientResult));
            return true;
        }
        if (msgJSON.email) {
            logger.debug('write a file for custom email address', msgJSON);
            const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
            const configFileJSON = JSON.parse(fs.readFileSync(location, 'utf8'));
            configFileJSON.adminEmail = msgJSON.email;
            fs.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
        }
        logger.debug(`going to look in the directory tmp/${msgJSON.deployId}/orgInit.sh`);
        let parsedLines = [];
        if (!fs.existsSync(`tmp/${msgJSON.deployId}/orgInit.sh`)) {
            logger.debug('no orgInit.sh.  Will use default');
            fs.writeFileSync(`tmp/${msgJSON.deployId}/orgInit.sh`, `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`);
        }
        try {
            parsedLines = await lineParse(msgJSON, visitor);
            logger.debug('these are the parsed lines:');
            logger.debug(JSON.stringify(parsedLines));
        }
        catch (err) { }
        const localLineRunner = new lineRunner(msgJSON, parsedLines, redis, clientResult);
        try {
            const output = await localLineRunner.runLines();
            visitor
                .event('deploy complete', msgJSON.template, 'deploytime', output.completeTimestamp.getTime() - output.browserStartTime.getTime())
                .send();
            visitor
                .event('deploy complete', msgJSON.template, 'opentime', output.openTimestamp.getTime() - output.browserStartTime.getTime())
                .send();
        }
        catch (e) {
            logger.error('Deployment error', { request: msgJSON, error: JSON.stringify(e) });
            visitor.event('deploy fail', msgJSON.template).send();
            await redis.publish(ex, JSON.stringify({
                username: msgJSON.username,
                delete: true
            }));
        }
        visitor.event('deploy complete', msgJSON.template).send();
    }
    await exec(`rm -rf tmp/${msgJSON.deployId}`);
    return true;
};
module.exports = check;
