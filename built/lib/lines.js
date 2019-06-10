"use strict";
const logger = require("heroku-logger");
const stripcolor = require("strip-color");
const types_1 = require("./types");
const utilities = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const argStripper = require("./argStripper");
const execProm_1 = require("../lib/execProm");
const lines = function (msgJSON, lines, redisPub, output) {
    this.msgJSON = msgJSON;
    this.lines = lines;
    this.redisPub = redisPub;
    this.runLines = async function runLines() {
        logger.debug('starting the line runs');
        for (const line of this.lines) {
            let localLine = line;
            let summary;
            let shortForm;
            logger.debug(localLine);
            if (localLine.includes('sfdx force:org:open') &&
                !localLine.includes(' -r')) {
                summary = types_1.commandSummary.OPEN;
                localLine = `${localLine} -r`;
            }
            else if (localLine.includes(':user:password')) {
                summary = types_1.commandSummary.PASSWORD_GEN;
            }
            else if (localLine.includes(':org:create')) {
                localLine = argStripper(localLine, '--setalias');
                localLine = argStripper(localLine, '-a');
                summary = types_1.commandSummary.ORG_CREATE;
            }
            else if (localLine.includes('sfdx force:source:push')) {
                summary = types_1.commandSummary.PUSH;
            }
            else if (localLine.includes('sfdx force:source:push')) {
                summary = types_1.commandSummary.PUSH;
            }
            else if (localLine.includes('sfdx force:source:push')) {
                summary = types_1.commandSummary.PUSH;
            }
            else if (localLine.includes('sfdx force:user:create')) {
                summary = types_1.commandSummary.USER_CREATE;
            }
            else if (localLine.includes('sfdx force:apex:execute')) {
                summary = types_1.commandSummary.APEX_EXEC;
            }
            else if (localLine.includes('sfdx force:user:permset')) {
                summary = types_1.commandSummary.PERMSET;
            }
            else if (localLine.includes('sfdx force:data:')) {
                summary = types_1.commandSummary.DATA;
            }
            else if (localLine.includes(':package:install')) {
                summary = types_1.commandSummary.PACKAGE;
            }
            else if (localLine.includes('sfdx force:mdapi:deploy')) {
                summary = types_1.commandSummary.DEPLOY;
            }
            else if (localLine.includes('sfdx shane:heroku:repo:deploy')) {
                summary = types_1.commandSummary.HEROKU_DEPLOY;
                if (!process.env.HEROKU_API_KEY) {
                    logger.error('there is no HEROKU_API_KEY defined, but shane:heroku:repo:deploy is used in an .orgInit', {
                        repo: `${msgJSON.username}/${msgJSON.repo}`
                    });
                }
            }
            else {
                logger.info('unhandled command will show up directly in the UI', {
                    command: localLine,
                    repo: `${msgJSON.username}/${msgJSON.repo}`
                });
            }
            let lineResult;
            logger.debug(`running line-- ${localLine}`);
            try {
                lineResult = await execProm_1.exec(localLine, { cwd: `tmp/${msgJSON.deployId}`, shell: '/bin/bash' });
                if (localLine.includes('--json')) {
                    let response = JSON.parse(stripcolor(lineResult.stdout));
                    if (response.status !== 0) {
                        output.errors.push({
                            command: localLine,
                            error: response.message,
                            raw: response
                        });
                        logger.error(`error running line ${localLine} from ${msgJSON.username}/${msgJSON.repo}: ${response.message}`, response);
                    }
                    else {
                        logger.debug('line returned status 0');
                        if (summary === types_1.commandSummary.OPEN) {
                            response = utilities.urlFix(response);
                            output.mainUser.loginUrl = response.result.url;
                            output.mainUser.username = response.result.username;
                            output.openTimestamp = new Date();
                        }
                        else if (summary === types_1.commandSummary.ORG_CREATE) {
                            output.orgId = response.result.orgId;
                            output.mainUser.username = response.result.username;
                            shortForm = `created org ${response.result.orgId} with username ${response.result.username}`;
                        }
                        else if (summary === types_1.commandSummary.PASSWORD_GEN) {
                            output.mainUser.password = response.result.password;
                            shortForm = `set password to ${response.result.password} for user ${response.result.username || output.mainUser.username}`;
                        }
                        else if (summary === types_1.commandSummary.HEROKU_DEPLOY) {
                            const HR = {
                                appName: response.result.app.name,
                                dashboardUrl: `https://dashboard.heroku.com/apps/${response.result.app.name}`,
                                openUrl: response.result.resolved_success_url
                            };
                            shortForm = `created heroku app with name ${response.result.app.name}`;
                            output.herokuResults.push(HR);
                        }
                        else if (summary === types_1.commandSummary.USER_CREATE) {
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
                redisNormal_1.cdsPublish(output);
            }
            catch (e) {
                logger.error('a very serious error occurred on this line...in the catch section', e);
                output.complete = true;
                output.errors.push({
                    command: localLine,
                    error: `${e.name}: ${e.message}`,
                    raw: e
                });
                redisNormal_1.cdsPublish(output);
                throw new Error(e);
            }
        }
        output.complete = true;
        output.completeTimestamp = new Date();
        output.instanceUrl = await getInstanceUrl(`tmp/${msgJSON.deployId}`, output.mainUser.username);
        await Promise.all([
            redisNormal_1.cdsPublish(output),
            execProm_1.exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })
        ]);
        return output;
    };
};
const getInstanceUrl = async (path, username) => {
    const displayResults = await execProm_1.exec(`sfdx force:org:display -u ${username} --json`, { cwd: path });
    const displayResultsJSON = JSON.parse(stripcolor(displayResults.stdout)).result;
    return displayResultsJSON.instanceUrl;
};
module.exports = lines;
