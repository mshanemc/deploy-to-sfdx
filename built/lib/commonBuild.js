"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const logger = require("heroku-logger");
const redisNormal_1 = require("./redisNormal");
const lineParse_1 = require("./lineParse");
const lineRunner = require("./lines");
const timeTracking_1 = require("./timeTracking");
const execProm_1 = require("./execProm");
const utilities = require("./utilities");
const poolParse_1 = require("./poolParse");
const build = async (msgJSON) => {
    fs.ensureDirSync('tmp');
    let clientResult = {
        deployId: msgJSON.deployId,
        complete: false,
        errors: [],
        commandResults: [],
        additionalUsers: [],
        herokuResults: [],
        mainUser: {},
        browserStartTime: msgJSON.createdTimestamp || new Date(),
        buildStartTime: new Date()
    };
    const gitCloneCmd = utilities.getCloneCommand(msgJSON);
    try {
        const gitCloneResult = await execProm_1.execProm(gitCloneCmd, { cwd: 'tmp' });
        logger.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
        clientResult.commandResults.push({
            command: gitCloneCmd,
            raw: gitCloneResult.stderr
        });
        if (!msgJSON.pool)
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
        if (!msgJSON.pool)
            await redisNormal_1.cdsPublish(clientResult);
        return clientResult;
    }
    if (msgJSON.email) {
        logger.debug('deployQueueCheck: write a file for custom email address', msgJSON);
        const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
        const configFileJSON = JSON.parse(fs.readFileSync(location, 'utf8'));
        configFileJSON.adminEmail = msgJSON.email;
        fs.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
    }
    const orgInitPath = `tmp/${msgJSON.deployId}/orgInit.sh`;
    logger.debug(`deployQueueCheck: going to look in the directory ${orgInitPath}`);
    if (!fs.existsSync(orgInitPath)) {
        logger.debug('deployQueueCheck: no orgInit.sh.  Will use default');
        fs.writeFileSync(orgInitPath, `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`);
    }
    let parsedLines;
    if (msgJSON.pool) {
        clientResult.poolLines = await poolParse_1.poolParse(orgInitPath);
    }
    try {
        parsedLines = await lineParse_1.lineParse(msgJSON);
    }
    catch (e) {
        clientResult.errors.push({
            command: 'line parsing',
            error: e,
            raw: e
        });
        clientResult.complete = true;
        if (!msgJSON.pool)
            await redisNormal_1.cdsPublish(clientResult);
        return clientResult;
    }
    const localLineRunner = new lineRunner(msgJSON, parsedLines, redisNormal_1.redis, clientResult);
    try {
        clientResult = await localLineRunner.runLines();
        timeTracking_1.timesToGA(msgJSON, clientResult);
    }
    catch (e) {
        logger.error('deployQueueCheck: Deployment error', msgJSON);
        logger.error('deployQueueCheck: Deployment error', e);
        await redisNormal_1.deleteOrg(msgJSON.username);
    }
    await fs.remove(`tmp/${msgJSON.deployId}`);
    if (clientResult.herokuResults.length > 0) {
        await redisNormal_1.putHerokuCDS(clientResult);
    }
    return clientResult;
};
exports.build = build;
