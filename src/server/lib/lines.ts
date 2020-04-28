/* eslint-disable no-await-in-loop */
import logger from 'heroku-logger';

import { DeployRequest, SfdxDisplayResult } from './types';
import { utilities } from './utilities';
import { getArg, isByoo } from './namedUtilities';
import { lineParse } from './lineParse';
import { cdsPublish, deleteOrg } from './redisNormal';
import { exec, exec2JSON, exec2String } from './execProm';
import { CDS, commandSummary, HerokuResult, ClientResult, ClientError } from './CDS';
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
        output = outputAddError(
            { ...output, complete: true },
            {
                command: 'line parsing',
                error: e.message,
                raw: JSON.stringify(e)
            }
        );
        cdsPublish(output);
        return output;
    }
    // remove the open line(s) for pools and put them on the CDS
    if (msgJSON.pool) {
        output.poolLines = {
            openLine: lines.find((line) => line.includes('org:open'))
        };
        lines = lines.filter((line) => !line.includes('org:open'));
    }
    logger.debug('starting the line runs');

    for (const localLine of lines) {
        logger.debug(`running line-- ${localLine}`);
        // show what's currently running in the UI before it actually runs
        output.currentCommand = localLine;
        cdsPublish(output);

        const summary = getSummary(localLine, msgJSON);

        const commandResult: ClientResult = {
            commandStartTimestamp: new Date(),
            command: localLine,
            summary
        };

        try {
            if (localLine.includes('--json')) {
                // lineResult =

                let response = await exec2JSON(localLine, { cwd: `tmp/${msgJSON.deployId}`, shell: '/bin/bash' });
                // returned a reasonable error but not a full-on throw

                if (response.status !== 0) {
                    // you fail!
                    output.errors.push({
                        command: localLine,
                        error: response.message,
                        raw: response
                    });
                    logger.error(
                        `error running line ${localLine} from deploy that includes ${msgJSON.repos[0].username}/${msgJSON.repos[0].repo}: ${response.message}`,
                        response
                    );
                } else {
                    if (summary === commandSummary.OPEN) {
                        response = utilities.urlFix(response);
                        output.mainUser.openPath = getArg(localLine, '-p') ?? getArg(localLine, '--path');
                        output.mainUser.loginUrl = response.result.url; // only good for session token
                        output.mainUser.permalink = loginURL(output);

                        output.openTimestamp = new Date();
                        output.poolLines = {
                            openLine: localLine
                        };
                    } else if (summary === commandSummary.ORG_CREATE) {
                        output.orgId = response.result.orgId;
                        output.mainUser.username = response.result.username;
                        commandResult.shortForm = `created org ${response.result.orgId} with username ${response.result.username}`;
                    } else if (summary === commandSummary.PASSWORD_GEN) {
                        output.mainUser.password = response.result.password;
                        output.mainUser.permalink = loginURL(output);

                        commandResult.shortForm = `set password to ${response.result.password} for user ${
                            response.result.username ?? output.mainUser.username
                        }`;
                    } else if (summary === commandSummary.HEROKU_DEPLOY) {
                        const HR: HerokuResult = {
                            appName: response.result.app.name,
                            dashboardUrl: `https://dashboard.heroku.com/apps/${response.result.app.name}`,
                            openUrl: response.result.resolved_success_url
                        };
                        commandResult.shortForm = `created heroku app with name ${response.result.app.name}`;
                        output.herokuResults.push(HR);
                    } else if (summary === commandSummary.USER_CREATE) {
                        output.additionalUsers.push({
                            username: response.result.fields.username
                        });
                        commandResult.shortForm = `created user with username ${response.result.fields.username}`;
                    }
                }

                // always
                output.commandResults.push({
                    ...commandResult,
                    raw: response,
                    commandCompleteTimestamp: new Date()
                });
            } else {
                // run with string output only
                output.commandResults.push({
                    command: localLine,
                    raw: await exec2String(localLine, { cwd: `tmp/${msgJSON.deployId}`, shell: '/bin/bash' })
                });
            }

            // finally, publish the CDS to redis so clients can access the latest updates
            cdsPublish({ ...output, currentCommand: undefined });
        } catch (e) {
            if (msgJSON.pool && output.mainUser && output.mainUser.username) {
                // delete an org if one got created and it's a pool
                await deleteOrg(output.mainUser.username);
            }
            logger.error(`a very serious error occurred on this line...in the catch section: ${e.name}: ${e.message}`, e);
            // a more serious error...tell the client
            output = outputAddError(
                {
                    ...output,
                    complete: true,
                    currentCommand: undefined
                },
                {
                    command: localLine,
                    error: `${JSON.parse(e.stdout).name}: ${JSON.parse(e.stdout).message}`,
                    raw: JSON.parse(e.stdout)
                }
            );
            cdsPublish(output);

            // and throw so the requester can do the rest of logging to heroku logs and GA
            throw new Error(e);
        }
    } //end of the loop

    // used by pools, may be otherwise handy
    output = {
        ...output,
        complete: true,
        completeTimestamp: new Date(),
        currentCommand: undefined
    };
    if (!isByoo(msgJSON)) {
        const displayResults = await getDisplayResults(`tmp/${msgJSON.deployId}`, output.mainUser.username);
        output = {
            ...output,
            instanceUrl: displayResults.instanceUrl,
            expirationDate: displayResults.expirationDate
        };
        await Promise.all([cdsPublish(output), exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })]);
    } else {
        // logging out of byoo orgs doesn't exist
        await cdsPublish(output);
    }
    return output;
};

export { lineRunner };

const outputAddError = (output: CDS, newError: ClientError): CDS => ({
    ...output,
    errors: [...output.errors, newError]
});
