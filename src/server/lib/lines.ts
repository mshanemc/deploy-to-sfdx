/* eslint-disable no-await-in-loop */
import logger from 'heroku-logger';
import stripColor from 'strip-color';
import * as fs from 'fs-extra';

import { DeployRequest, SfdxDisplayResult } from './types';
import { utilities } from './utilities';
import { getPackageDirsFromFile } from './namedUtilities';
import { cdsPublish, deleteOrg } from './redisNormal';
import { argStripper } from './argStripper';
import { exec } from './execProm';
import { CDS, commandSummary, HerokuResult } from './CDS';
import { loginURL } from './loginURL';
import { processWrapper } from './processWrapper';

const getDisplayResults = async (path: string, username: string) => {
    const displayResults = await exec(`sfdx force:org:display -u ${username} --json`, { cwd: path });
    const displayResultsJSON = JSON.parse(stripColor(displayResults.stdout)).result as SfdxDisplayResult;
    return displayResultsJSON;
};

const getSummary = (localLine: string, msgJSON: DeployRequest) => {
    if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -r')) {
        return commandSummary.OPEN;
        // localLine = `${localLine} -r`;
    } else if (localLine.includes(':user:password')) {
        return commandSummary.PASSWORD_GEN;
    } else if (localLine.includes(':org:create')) {
        // handle the shane plugin and the stock commmand
        // no aliases allowed to keep the deployer from getting confused between deployments
        // localLine = argStripper(localLine, '--setalias');
        // localLine = argStripper(localLine, '-a');
        return commandSummary.ORG_CREATE;
    } else if (localLine.includes('sfdx force:source:push')) {
        return commandSummary.PUSH;
    } else if (localLine.includes('sfdx force:user:create')) {
        return commandSummary.USER_CREATE;
    } else if (localLine.includes('sfdx force:apex:execute')) {
        return commandSummary.APEX_EXEC;
    } else if (localLine.includes('sfdx force:user:permset')) {
        return commandSummary.PERMSET;
    } else if (localLine.includes('sfdx force:data:') || localLine.includes('sfdx automig:load')) {
        return commandSummary.DATA;
    } else if (localLine.includes(':package:install')) {
        return commandSummary.PACKAGE;
    } else if (localLine.includes('sfdx force:mdapi:deploy')) {
        return commandSummary.DEPLOY;
    } else if (localLine.includes('sfdx shane:heroku:repo:deploy')) {
        if (!processWrapper.HEROKU_API_KEY) {
            // check that heroku API key is defined in processWrapper
            logger.error('there is no HEROKU_API_KEY defined, but shane:heroku:repo:deploy is used in an .orgInit', {
                repo: `${msgJSON.username}/${msgJSON.repo}`
            });
        }
        return commandSummary.HEROKU_DEPLOY;
    } else {
        logger.info('unhandled command will show up directly in the UI', {
            command: localLine,
            repo: `${msgJSON.username}/${msgJSON.repo}`
        });
        return undefined;
    }
};

const lineRunner = function(msgJSON: DeployRequest, lines: string[], output: CDS) {
    this.msgJSON = msgJSON;
    this.lines = lines;

    this.runLines = async function runLines() {
        logger.debug('starting the line runs');

        for (const line of this.lines) {
            const lineStartTimestamp = new Date();
            let localLine = line;
            // let summary: commandSummary;
            let shortForm: string;

            logger.debug(localLine);
            const summary = getSummary(localLine, msgJSON);

            // corrections and improvements for individual commands
            if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -r')) {
                localLine = `${localLine} -r`;
            } else if (localLine.includes(':org:create')) {
                // handle the shane plugin and the stock commmand
                // no aliases allowed to keep the deployer from getting confused between deployments
                localLine = argStripper(localLine, '--setalias');
                localLine = argStripper(localLine, '-a');
                localLine = argStripper(localLine, '-v');
                localLine = argStripper(localLine, '-v');
            } else if (msgJSON.byoo && localLine.includes('sfdx force:user:permset:assign')) {
                // the username on byoo deploys is a accesstoken, which confuses the standard permset assign command
                localLine = localLine.replace('force:user', 'shane:user');
            } else if (msgJSON.byoo && localLine.includes('sfdx force:source:push')) {
                // source push only works on scratch org or other source-tracking-enabled orgs.
                // get the packageDirectories from the folder and modify the push command to deploy those instead
                logger.debug(`byoo and source:push: ${localLine}`);
                const project = await fs.readJSON(`tmp/${msgJSON.deployId}/sfdx-project.json`);

                try {
                    localLine = localLine.replace('sfdx force:source:push', `sfdx force:source:deploy -p ${getPackageDirsFromFile(project)}`);
                } catch (e) {
                    const message = `security error on projectJSON: ${localLine}`;
                    logger.error(message);

                    output.errors.push({
                        command: localLine,
                        error: message,
                        raw: localLine
                    });
                    cdsPublish(output);
                    throw new Error(message);
                }
            } else if (localLine.includes('sfdx automig:load')) {
                // if the script didn't supply the concise line, make sure it's there.
                localLine = `${argStripper(localLine, '--concise', true)} --concise`;
            }

            let lineResult;

            // show what's currently running before it actually runs
            logger.debug(`running line-- ${localLine}`);
            output.currentCommand = localLine;
            cdsPublish(output);

            try {
                lineResult = await exec(localLine, { cwd: `tmp/${msgJSON.deployId}`, shell: '/bin/bash' });

                if (localLine.includes('--json')) {
                    let response = JSON.parse(stripColor(lineResult.stdout));
                    // returned a reasonable error but not a full-on throw

                    if (response.status !== 0) {
                        // you fail!
                        output.errors.push({
                            command: localLine,
                            error: response.message,
                            raw: response
                        });
                        logger.error(`error running line ${localLine} from ${msgJSON.username}/${msgJSON.repo}: ${response.message}`, response);
                    } else {
                        if (summary === commandSummary.OPEN) {
                            response = utilities.urlFix(response);
                            // put the path into the CDS
                            output.mainUser.openPath = utilities.getArg(localLine, '-p') || utilities.getArg(localLine, '--path');
                            // temporary
                            output.mainUser.loginUrl = response.result.url;
                            output.mainUser.permalink = loginURL(output);
                            // output.mainUser.username = response.result.username;

                            output.openTimestamp = new Date();
                        } else if (summary === commandSummary.ORG_CREATE) {
                            output.orgId = response.result.orgId;
                            output.mainUser.username = response.result.username;
                            shortForm = `created org ${response.result.orgId} with username ${response.result.username}`;
                        } else if (summary === commandSummary.PASSWORD_GEN) {
                            output.mainUser.password = response.result.password;
                            output.mainUser.permalink = loginURL(output);

                            shortForm = `set password to ${response.result.password} for user ${response.result.username ||
                                output.mainUser.username}`;
                        } else if (summary === commandSummary.HEROKU_DEPLOY) {
                            const HR: HerokuResult = {
                                appName: response.result.app.name,
                                dashboardUrl: `https://dashboard.heroku.com/apps/${response.result.app.name}`,
                                openUrl: response.result.resolved_success_url
                            };
                            shortForm = `created heroku app with name ${response.result.app.name}`;
                            output.herokuResults.push(HR);
                        } else if (summary === commandSummary.USER_CREATE) {
                            output.additionalUsers.push({
                                username: response.result.fields.username
                            });
                            shortForm = `created user with username ${response.result.fields.username}`;
                        }
                    }

                    // always
                    output.commandResults.push({
                        command: line,
                        summary,
                        raw: response,
                        shortForm,
                        commandStartTimestamp: lineStartTimestamp,
                        commandCompleteTimestamp: new Date()
                    });
                } else {
                    output.commandResults.push({
                        command: line,
                        raw: lineResult
                    });
                }

                // finally, publish the CDS to redis so clients can access the latest updates
                output.currentCommand = '';
                cdsPublish(output);
            } catch (e) {
                if (msgJSON.pool && output.mainUser && output.mainUser.username) {
                    // delete an org if one got created and it's a pool
                    await deleteOrg(output.deployId);
                }
                logger.error(`a very serious error occurred on this line...in the catch section: ${e.name}: ${e.message}`, e);
                // a more serious error...tell the client
                output.complete = true;
                output.errors.push({
                    command: localLine,
                    error: `${JSON.parse(e.stdout).name}: ${JSON.parse(e.stdout).message}`,
                    raw: JSON.parse(e.stdout)
                });
                output.currentCommand = '';
                cdsPublish(output);

                // and throw so the requester can do the rest of logging to heroku logs and GA
                throw new Error(e);
            }
        } //end of the loop

        // we're done here
        output.complete = true;
        output.completeTimestamp = new Date();

        // used by pools, may be otherwise handy
        const displayResults = await getDisplayResults(`tmp/${msgJSON.deployId}`, output.mainUser.username);

        output.instanceUrl = displayResults.instanceUrl;
        output.expirationDate = displayResults.expirationDate;

        await Promise.all([cdsPublish(output), exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })]);
        return output;
    };
};

export { lineRunner };
