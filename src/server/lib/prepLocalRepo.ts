import * as fs from 'fs-extra';
import logger from 'heroku-logger';
import { DeployRequest } from './types';
import { utilities } from './utilities';
import { CDS } from './CDS';
import { execProm } from './execProm';

const orgInitDefault = `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
sfdx force:source:push
sfdx force:org:open`;

const gitClone = async (msgJSON: DeployRequest, cds: CDS): Promise<CDS> => {
    const gitCloneCmd = utilities.getCloneCommand(msgJSON);

    try {
        const gitCloneResult = await execProm(gitCloneCmd, { cwd: 'tmp' });
        logger.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
        cds.commandResults.push({
            command: gitCloneCmd,
            raw: gitCloneResult.stderr
        });
    } catch (err) {
        logger.warn(`deployQueueCheck: bad repo--https://github.com/${msgJSON.username}/${msgJSON.repo}.git`);
        cds.errors.push({
            command: gitCloneCmd,
            error: err.stderr,
            raw: err
        });
        cds.complete = true;
    }
    return cds;
};

const prepOrgInit = async (msgJSON: DeployRequest): Promise<string> => {
    const orgInitPath = `tmp/${msgJSON.deployId}/orgInit.sh`;
    logger.debug(`deployQueueCheck: going to look in the directory ${orgInitPath}`);

    if (msgJSON.byoo) {
        const byooInitPath = `tmp/${msgJSON.deployId}/byooInit.sh`;
        if (fs.existsSync(byooInitPath)) {
            // it's byoo and you have a special byoo file that supercedes orgInit.sh
            await fs.copyFile(byooInitPath, orgInitPath);
        }
    } else if (!fs.existsSync(orgInitPath)) {
        // it's not byoo and there is no file, so we'll create one
        logger.debug('deployQueueCheck: no orgInit.sh.  Will use default');
        await fs.writeFile(orgInitPath, orgInitDefault);
    }
    return orgInitPath;
};

const prepProjectScratchDef = async (msgJSON: DeployRequest): Promise<void> => {
    // if you passed in a custom email address, we need to edit the config file and add the adminEmail property

    if (msgJSON.email) {
        logger.debug('deployQueueCheck: write a file for custom email address', msgJSON);
        const location = `tmp/${msgJSON.deployId}/config/project-scratch-def.json`;
        const configFileJSON = await fs.readJSON(location);
        configFileJSON.adminEmail = msgJSON.email;
        await fs.writeJSON(location, configFileJSON);
    }
};

export { prepOrgInit, prepProjectScratchDef, gitClone };
