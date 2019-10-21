"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const strip_color_1 = __importDefault(require("strip-color"));
const utilities_1 = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const argStripper_1 = require("./argStripper");
const execProm_1 = require("./execProm");
const CDS_1 = require("./CDS");
const lineRunner = function (msgJSON, lines, output) {
    this.msgJSON = msgJSON;
    this.lines = lines;
    this.runLines = async function runLines() {
        heroku_logger_1.default.debug('starting the line runs');
        for (const line of this.lines) {
            let localLine = line;
            let summary;
            let shortForm;
            heroku_logger_1.default.debug(localLine);
            summary = getSummary(localLine, msgJSON);
            if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -r')) {
                localLine = `${localLine} -r`;
            }
            else if (localLine.includes(':org:create')) {
                localLine = argStripper_1.argStripper(localLine, '--setalias');
                localLine = argStripper_1.argStripper(localLine, '-a');
            }
            let lineResult;
            heroku_logger_1.default.debug(`running line-- ${localLine}`);
            output.currentCommand = localLine;
            redisNormal_1.cdsPublish(output);
            try {
                lineResult = await execProm_1.exec(localLine, { cwd: `tmp/${msgJSON.deployId}`, shell: '/bin/bash' });
                if (localLine.includes('--json')) {
                    let response = JSON.parse(strip_color_1.default(lineResult.stdout));
                    if (response.status !== 0) {
                        output.errors.push({
                            command: localLine,
                            error: response.message,
                            raw: response
                        });
                        heroku_logger_1.default.error(`error running line ${localLine} from ${msgJSON.username}/${msgJSON.repo}: ${response.message}`, response);
                    }
                    else {
                        if (summary === CDS_1.commandSummary.OPEN) {
                            response = utilities_1.utilities.urlFix(response);
                            output.mainUser.loginUrl = response.result.url;
                            output.mainUser.username = response.result.username;
                            output.openTimestamp = new Date();
                        }
                        else if (summary === CDS_1.commandSummary.ORG_CREATE) {
                            output.orgId = response.result.orgId;
                            output.mainUser.username = response.result.username;
                            shortForm = `created org ${response.result.orgId} with username ${response.result.username}`;
                        }
                        else if (summary === CDS_1.commandSummary.PASSWORD_GEN) {
                            output.mainUser.password = response.result.password;
                            shortForm = `set password to ${response.result.password} for user ${response.result.username ||
                                output.mainUser.username}`;
                        }
                        else if (summary === CDS_1.commandSummary.HEROKU_DEPLOY) {
                            const HR = {
                                appName: response.result.app.name,
                                dashboardUrl: `https://dashboard.heroku.com/apps/${response.result.app.name}`,
                                openUrl: response.result.resolved_success_url
                            };
                            shortForm = `created heroku app with name ${response.result.app.name}`;
                            output.herokuResults.push(HR);
                        }
                        else if (summary === CDS_1.commandSummary.USER_CREATE) {
                            output.additionalUsers.push({
                                username: response.result.fields.username
                            });
                            shortForm = `created user with username ${response.result.fields.username}`;
                        }
                    }
                    output.commandResults.push({
                        command: line,
                        summary,
                        raw: response,
                        shortForm
                    });
                }
                else {
                    output.commandResults.push({
                        command: line,
                        raw: lineResult
                    });
                }
                output.currentCommand = '';
                redisNormal_1.cdsPublish(output);
            }
            catch (e) {
                if (msgJSON.pool && output.mainUser && output.mainUser.username) {
                    await redisNormal_1.deleteOrg(output.deployId);
                }
                heroku_logger_1.default.error(`a very serious error occurred on this line...in the catch section: ${e.name}: ${e.message}`, e);
                output.complete = true;
                output.errors.push({
                    command: localLine,
                    error: `${JSON.parse(e.stdout).name}: ${JSON.parse(e.stdout).message}`,
                    raw: JSON.parse(e.stdout)
                });
                output.currentCommand = '';
                redisNormal_1.cdsPublish(output);
                throw new Error(e);
            }
        }
        output.complete = true;
        output.completeTimestamp = new Date();
        const displayResults = await getDisplayResults(`tmp/${msgJSON.deployId}`, output.mainUser.username);
        output.instanceUrl = displayResults.instanceUrl;
        output.expirationDate = displayResults.expirationDate;
        await Promise.all([redisNormal_1.cdsPublish(output), execProm_1.exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })]);
        return output;
    };
};
exports.lineRunner = lineRunner;
const getDisplayResults = async (path, username) => {
    const displayResults = await execProm_1.exec(`sfdx force:org:display -u ${username} --json`, { cwd: path });
    const displayResultsJSON = JSON.parse(strip_color_1.default(displayResults.stdout)).result;
    return displayResultsJSON;
};
const getSummary = (localLine, msgJSON) => {
    if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -r')) {
        return CDS_1.commandSummary.OPEN;
    }
    else if (localLine.includes(':user:password')) {
        return CDS_1.commandSummary.PASSWORD_GEN;
    }
    else if (localLine.includes(':org:create')) {
        return CDS_1.commandSummary.ORG_CREATE;
    }
    else if (localLine.includes('sfdx force:source:push')) {
        return CDS_1.commandSummary.PUSH;
    }
    else if (localLine.includes('sfdx force:user:create')) {
        return CDS_1.commandSummary.USER_CREATE;
    }
    else if (localLine.includes('sfdx force:apex:execute')) {
        return CDS_1.commandSummary.APEX_EXEC;
    }
    else if (localLine.includes('sfdx force:user:permset')) {
        return CDS_1.commandSummary.PERMSET;
    }
    else if (localLine.includes('sfdx force:data:')) {
        return CDS_1.commandSummary.DATA;
    }
    else if (localLine.includes(':package:install')) {
        return CDS_1.commandSummary.PACKAGE;
    }
    else if (localLine.includes('sfdx force:mdapi:deploy')) {
        return CDS_1.commandSummary.DEPLOY;
    }
    else if (localLine.includes('sfdx shane:heroku:repo:deploy')) {
        if (!process.env.HEROKU_API_KEY) {
            heroku_logger_1.default.error('there is no HEROKU_API_KEY defined, but shane:heroku:repo:deploy is used in an .orgInit', {
                repo: `${msgJSON.username}/${msgJSON.repo}`
            });
        }
        return CDS_1.commandSummary.HEROKU_DEPLOY;
    }
    else {
        heroku_logger_1.default.info('unhandled command will show up directly in the UI', {
            command: localLine,
            repo: `${msgJSON.username}/${msgJSON.repo}`
        });
    }
};
