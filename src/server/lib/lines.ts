/* eslint-disable no-await-in-loop */
import logger from 'heroku-logger';
import stripColor from 'strip-color';

import { DeployRequest, SfdxDisplayResult } from './types';
import { utilities } from './utilities';
import { getArg, isByoo } from './namedUtilities';
import { lineParse } from './lineParse';
import { cdsPublish, deleteOrg } from './redisNormal';
import { exec, exec2JSON } from './execProm';
import { CDS, commandSummary, HerokuResult } from './CDS';
import { loginURL } from './loginURL';
import { getSummary } from './getSummary';

const getDisplayResults = async (path: string, username: string): Promise<SfdxDisplayResult> =>
    (await exec2JSON(`sfdx force:org:display -u ${username} --json`, { cwd: path })).result as SfdxDisplayResult;

const lineRunner = async (msgJSON: DeployRequest, output: CDS): Promise<CDS> => {
    // get the lines we'll run
    let lines;
    try {
        lines = await lineParse(msgJSON);
        output.lineCount = isByoo(msgJSON) ? lines.length + 2 : lines.length + 1;
        await cdsPublish(output); //1 extra to account for the git clone command
    } catch (e) {
        output.errors.push({
            command: 'line parsing',
            error: e,
            raw: e
        });
        output.complete = true;
        cdsPublish(output);
        return output;
    }

    logger.debug('starting the line runs');

    for (const localLine of lines) {
        const lineStartTimestamp = new Date();
        let shortForm: string;
        const summary = getSummary(localLine, msgJSON);

        // corrections and improvements for individual commands
        let lineResult;

        // show what's currently running in the UI before it actually runs
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
                        output.mainUser.openPath = getArg(localLine, '-p') || getArg(localLine, '--path');
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

                        shortForm = `set password to ${response.result.password} for user ${response.result.username || output.mainUser.username}`;
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
                    command: localLine,
                    summary,
                    raw: response,
                    shortForm,
                    commandStartTimestamp: lineStartTimestamp,
                    commandCompleteTimestamp: new Date()
                });
            } else {
                output.commandResults.push({
                    command: localLine,
                    raw: lineResult
                });
            }

            // finally, publish the CDS to redis so clients can access the latest updates
            cdsPublish({ ...output, currentCommand: undefined });
        } catch (e) {
            if (msgJSON.pool && output.mainUser && output.mainUser.username) {
                // delete an org if one got created and it's a pool
                await deleteOrg(output.deployId);
            }
            logger.error(`a very serious error occurred on this line...in the catch section: ${e.name}: ${e.message}`, e);
            // a more serious error...tell the client
            output.errors.push({
                command: localLine,
                error: `${JSON.parse(e.stdout).name}: ${JSON.parse(e.stdout).message}`,
                raw: JSON.parse(e.stdout)
            });
            output = { ...output, complete: true, currentCommand: undefined };
            cdsPublish(output);

            // and throw so the requester can do the rest of logging to heroku logs and GA
            throw new Error(e);
        }
    } //end of the loop

    // used by pools, may be otherwise handy
    const displayResults = await getDisplayResults(`tmp/${msgJSON.deployId}`, output.mainUser.username);
    output = {
        ...output,
        complete: true,
        completeTimestamp: new Date(),
        currentCommand: undefined,
        instanceUrl: displayResults.instanceUrl,
        expirationDate: displayResults.expirationDate
    };

    await Promise.all([cdsPublish(output), exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })]);
    return output;
};

export { lineRunner };
