"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const redisNormal_1 = require("./redisNormal");
const lineParse_1 = require("./lineParse");
const lines_1 = require("./lines");
const timeTracking_1 = require("./timeTracking");
const execProm_1 = require("./execProm");
const utilities = __importStar(require("./utilities"));
const poolParse_1 = require("./poolParse");
const CDS_1 = require("./CDS");
const build = async (msgJSON) => {
    fs_extra_1.default.ensureDirSync('tmp');
    let clientResult = new CDS_1.CDS({
        deployId: msgJSON.deployId,
        browserStartTime: msgJSON.createdTimestamp,
        isPool: msgJSON.pool
    });
    await redisNormal_1.cdsPublish(clientResult);
    const gitCloneCmd = utilities.getCloneCommand(msgJSON);
    try {
        const gitCloneResult = await execProm_1.execProm(gitCloneCmd, { cwd: 'tmp' });
        heroku_logger_1.default.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
        clientResult.commandResults.push({
            command: gitCloneCmd,
            raw: gitCloneResult.stderr
        });
        await redisNormal_1.cdsPublish(clientResult);
    }
    catch (err) {
        heroku_logger_1.default.warn(`deployQueueCheck: bad repo--https://github.com/${msgJSON.username}/${msgJSON.repo}.git`);
        clientResult.errors.push({
            command: gitCloneCmd,
            error: err.stderr,
            raw: err
        });
        clientResult.complete = true;
        await redisNormal_1.cdsPublish(clientResult);
        return clientResult;
    }
    if (msgJSON.email) {
        heroku_logger_1.default.debug('deployQueueCheck: write a file for custom email address', msgJSON);
        const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
        const configFileJSON = JSON.parse(fs_extra_1.default.readFileSync(location, 'utf8'));
        configFileJSON.adminEmail = msgJSON.email;
        fs_extra_1.default.writeFileSync(location, JSON.stringify(configFileJSON), 'utf8');
    }
    const orgInitPath = `tmp/${msgJSON.deployId}/orgInit.sh`;
    heroku_logger_1.default.debug(`deployQueueCheck: going to look in the directory ${orgInitPath}`);
    if (!fs_extra_1.default.existsSync(orgInitPath)) {
        heroku_logger_1.default.debug('deployQueueCheck: no orgInit.sh.  Will use default');
        fs_extra_1.default.writeFileSync(orgInitPath, `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
        sfdx force:source:push
        sfdx force:org:open`);
    }
    let parsedLines;
    if (msgJSON.pool) {
        clientResult.poolLines = await poolParse_1.poolParse(orgInitPath);
    }
    try {
        parsedLines = await lineParse_1.lineParse(msgJSON);
        clientResult.lineCount = parsedLines.length + 1;
        await redisNormal_1.cdsPublish(clientResult);
    }
    catch (e) {
        clientResult.errors.push({
            command: 'line parsing',
            error: e,
            raw: e
        });
        clientResult.complete = true;
        await redisNormal_1.cdsPublish(clientResult);
        return clientResult;
    }
    const localLineRunner = new lines_1.lineRunner(msgJSON, parsedLines, clientResult);
    try {
        clientResult = await localLineRunner.runLines();
        timeTracking_1.timesToGA(msgJSON, clientResult);
    }
    catch (e) {
        heroku_logger_1.default.error('deployQueueCheck: Deployment error', msgJSON);
        heroku_logger_1.default.error('deployQueueCheck: Deployment error', e);
    }
    await fs_extra_1.default.remove(`tmp/${msgJSON.deployId}`);
    if (clientResult.herokuResults.length > 0) {
        await redisNormal_1.putHerokuCDS(clientResult);
    }
    return clientResult;
};
exports.build = build;
