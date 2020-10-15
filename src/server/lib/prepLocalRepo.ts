/* eslint-disable no-await-in-loop */
import * as fs from 'fs-extra';
import logger from 'heroku-logger';
import { DeployRequest } from './types';
import { getCloneCommands, isMultiRepo, isByoo } from './namedUtilities';
import { CDS } from './CDS';
import { execProm } from './execProm';
import { buildScratchDef } from './multirepo/buildScratchDefs';
import { MergeProjectJSONs } from './multirepo/mergeProjectJSONs';

const scratchDefFileName = 'project-scratch-def.json';
const projectDefFileName = 'sfdx-project.json';

const orgInitDefault = `sfdx force:org:create -f config/project-scratch-def.json -s -d 1
sfdx force:source:push
sfdx force:org:open`;

const prepareRepo = async (msgJSON: DeployRequest, cds: CDS): Promise<CDS> => {
    if (isMultiRepo(msgJSON)) {
        // we have to create a parent project for multi-repo deploys
        await execProm(`sfdx force:project:create -n ${msgJSON.deployId}`, { cwd: 'tmp' });
    }

    const gitCloneCmds = getCloneCommands(msgJSON);

    for (const command of gitCloneCmds) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const gitCloneResult = await execProm(command, { cwd: 'tmp' });
            logger.debug(`deployQueueCheck: ${gitCloneResult.stderr}`);
            cds.commandResults.push({
                command,
                raw: gitCloneResult.stderr
            });
        } catch (err) {
            logger.warn(`deployQueueCheck: bad repo--${command}`);
            cds.errors.push({
                command,
                error: err.stderr,
                raw: err
            });
            cds.complete = true;
        }
    }
    return cds;
};

const prepOrgInit = async (msgJSON: DeployRequest): Promise<void> => {
    const orgInitPath = `tmp/${msgJSON.deployId}/orgInit.sh`;
    logger.debug(`deployQueueCheck: going to look in the directory ${orgInitPath}`);

    const paths = msgJSON.repos.map((repo) =>
        isMultiRepo(msgJSON)
            ? `tmp/${msgJSON.deployId}/${repo.repo}/orgInit.sh`
            : `tmp/${msgJSON.deployId}/orgInit.sh`
    );

    for (const path of paths) {
        if (isByoo(msgJSON) && fs.existsSync(path.replace('orgInit', 'byooInit'))) {
            // it's byoo and you have a special byoo init file that supercedes the normal orgInit.sh
            // so copy that file into the default location
            logger.debug(`found byoo file.  Replacing ${path}`);
            await fs.copyFile(path.replace('orgInit', 'byooInit'), path);
        }
        if (!fs.existsSync(path)) {
            // there is no init file, so we'll create a default one
            logger.debug(`deployQueueCheck: no orgInit.sh for ${path}.  Will use default`);
            await fs.writeFile(path, orgInitDefault);
        }
        logger.debug(`init file ready at ${path}`);
    }
};

const prepProjectScratchDef = async (msgJSON: DeployRequest): Promise<void> => {
    // it's ugly, but at least it executes in parallel
    if (isMultiRepo(msgJSON)) {
        await Promise.all([
            // merge all the scratch def files
            fs.writeJSON(
                `tmp/${msgJSON.deployId}/config/${scratchDefFileName}`,
                buildScratchDef({
                    repoFileJSONs: await Promise.all(
                        msgJSON.repos.map((repo) =>
                            fs.readJSON(
                                `tmp/${msgJSON.deployId}/${repo.repo}/config/${scratchDefFileName}`
                            )
                        )
                    ),
                    projectname: msgJSON.deployId
                })
            ),
            // merge all the sfdx-project files
            fs.writeJSON(
                `tmp/${msgJSON.deployId}/${projectDefFileName}`,
                MergeProjectJSONs({
                    projectJSONs: await Promise.all(
                        msgJSON.repos.map((repo) =>
                            fs.readJSON(
                                `tmp/${msgJSON.deployId}/${repo.repo}/${projectDefFileName}`
                            )
                        )
                    ),
                    localFilePaths: msgJSON.repos.map((repo) => repo.repo)
                })
            )
        ]);
    }
    // if you passed in a custom email address, we need to edit the config file and add the adminEmail property
    if (msgJSON.email) {
        logger.debug('deployQueueCheck: write a file for custom email address', msgJSON);
        const location = `tmp/${msgJSON.deployId}/config/${scratchDefFileName}`;
        await fs.writeJSON(location, {
            ...(await fs.readJSON(location)),
            adminEmail: msgJSON.email
        });
    }
};

export { prepOrgInit, prepProjectScratchDef, prepareRepo };
