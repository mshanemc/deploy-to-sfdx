"use strict";
const logger = require("heroku-logger");
const util = require("util");
const utilities = require("./utilities");
const redis = require("./redisNormal");
const argStripper = require("./argStripper");
const types_1 = require("./types");
const exec = util.promisify(require('child_process').exec);
const ex = 'deployMsg';
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
            if (!localLine.includes('--json')) {
                throw new Error(`Every line should have included --json by this point.  Cannot process ${localLine}`);
            }
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
            else {
                logger.info('unhandled command will show up directly in the UI', {
                    command: localLine,
                    repo: `${msgJSON.username}/${msgJSON.repo}`
                });
            }
            if (localLine.includes('sfdx shane:heroku:repo:deploy')) {
                if (!process.env.HEROKU_API_KEY) {
                    logger.error('there is no HEROKU_API_KEY defined, but shane:heroku:repo:deploy is used in an .orgInit', {
                        repo: `${msgJSON.username}/${msgJSON.repo}`
                    });
                }
                summary = types_1.commandSummary.HEROKU_DEPLOY;
                const days = parseInt(utilities.getArg(localLine, '-d'), 10) ||
                    parseInt(utilities.getArg(localLine, '--days'), 10) ||
                    7;
                const herokuDeleteMessage = {
                    herokuDelete: true,
                    appName: utilities.getArg(localLine, '-n') ||
                        utilities.getArg(localLine, '--name'),
                    expiration: Date.now() + days * 24 * 60 * 60 * 1000
                };
                redis.rpush('herokuDeletes', JSON.stringify(herokuDeleteMessage));
            }
            let lineResult;
            logger.debug(`running line-- ${localLine}`);
            try {
                lineResult = await exec(localLine, { cwd: `tmp/${msgJSON.deployId}` });
                let response = JSON.parse(lineResult.stdout);
                if (response.status !== 0) {
                    output.errors.push({
                        command: localLine,
                        error: response.message,
                        raw: response
                    });
                    logger.error(`error running line ${localLine} from ${msgJSON.username}/${msgJSON.repo}: ${response.message}`);
                    this.msgJSON.visitor
                        .event('deploy error', this.msgJSON.template, response.message)
                        .send();
                }
                else {
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
                    else if (summary === types_1.commandSummary.USER_CREATE) {
                        output.additionalUsers.push({
                            username: response.result.fields.username
                        });
                        shortForm = `created user with username ${response.result.fields.username}`;
                    }
                    output.commandResults.push({
                        command: line,
                        summary,
                        raw: response,
                        shortForm
                    });
                }
                redisPub.publish(ex, JSON.stringify(output));
            }
            catch (e) {
                output.errors.push({
                    command: localLine,
                    error: `${e.name}: ${e.message}`,
                    raw: e.stack
                });
                redisPub.publish(ex, JSON.stringify(output));
                throw new Error(e);
            }
        }
        output.complete = true;
        output.completeTimestamp = new Date();
        await Promise.all([
            redisPub.publish(ex, JSON.stringify(output)),
            exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })
        ]);
        return output;
    };
};
module.exports = lines;
