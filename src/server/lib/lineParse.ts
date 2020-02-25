/* eslint-disable no-await-in-loop */
import * as fs from 'fs-extra';

// import logger from 'heroku-logger';

import { shellSanitize } from './shellSanitize';
import { argStripper } from './argStripper';
import { DeployRequest } from './types';
import { isMultiRepo, isByoo, getPackageDirsFromFile, getArg } from './namedUtilities';
import { filesToLines } from './fileToLines';

const jsonify = (line: string): string => {
    if (line.startsWith('sfdx ')) {
        // TODO: handling for & at the end of line for background runs
        return `${argStripper(line, '--json', true)} --json`;
    } else {
        return line;
    }
};

const byooFilter = (line: string): boolean => {
    if (line.includes('org:create')) {
        return false;
    }
    if (line.includes('user:password')) {
        return false;
    }
    return true;
};

const securityAssertions = (line: string): string => {
    if (!shellSanitize(line)) {
        throw new Error(`ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${line}`);
    }
    if (!line.startsWith('sfdx ')) {
        throw new Error(`ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${line}`);
    }
    if (line.includes(' -u ')) {
        throw new Error(
            `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${line}`
        );
    }
    if (line.includes(' --taretusername ')) {
        throw new Error(
            `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${line}`
        );
    }
    return line;
};

// corrections and improvements for individual commands, always runs
const lineCorrections = (line: string, msgJSON: DeployRequest): string => {
    // we ALWAYS want -r instead of real open on our server
    if (line.includes('sfdx force:org:open') && !line.includes(' -r')) {
        return `${line} -r`;
    }
    if (line.includes(':org:create')) {
        // console.log(`line reached corrections for create:  it is ${line}`);
        // handle the shane plugin and the stock commmand
        // no aliases allowed to keep the deployer from getting confused between deployments
        line = argStripper(line, '--setalias');
        line = argStripper(line, '-a');
        // no hub changes allowed
        line = argStripper(line, '--targetdevhubusername');
        line = argStripper(line, '-v');
        return line;
    }
    if (isByoo(msgJSON) && line.includes('sfdx force:user:permset:assign')) {
        // the username on byoo deploys is a accesstoken, which confuses the standard permset assign command
        return line.replace('force:user', 'shane:user');
    }
    if (line.includes('sfdx automig:load')) {
        // if the script didn't supply the concise line, make sure it's there.
        return `${argStripper(line, '--concise', true)} --concise`;
    }
    if (line.includes('sfdx force:source:push') && isByoo(msgJSON) && isMultiRepo(msgJSON)) {
        const project = fs.readJSONSync(`tmp/${msgJSON.deployId}/sfdx-project.json`);
        return line.replace('sfdx force:source:push', `sfdx force:source:deploy -p ${getPackageDirsFromFile(project)}`);
    }
    return line;
};

const thereCanBeOnlyOne = (lines: string[], textSoSearchFor: string) => {
    const passwordLines = lines.filter(line => line.includes(textSoSearchFor));

    if (passwordLines.length > 1) {
        const firstOccurence = lines.findIndex(line => line.includes(textSoSearchFor));
        return [
            ...lines.slice(0, firstOccurence + 1), // start until the first occurrence, inclusive
            ...lines.slice(firstOccurence + 2).filter(line => !line.includes(textSoSearchFor)) // and none of the occurrences after that
        ];
    } else {
        return lines;
    }
};

const multiOrgCorrections = (lines: string[]): string[] => {
    // only one password allowed for (multi org).  [BYOO will have them already removed at this stage]
    return thereCanBeOnlyOne(lines, 'user:password');
};

const getMaxDays = (lines: string[]): number =>
    Math.max(
        ...lines
            .filter(line => line.includes('org:create'))
            .map(line => parseInt(getArg(line, '-d'), 10) || parseInt(getArg(line, '--days'), 10) || 7)
    );

const lineParse = async (msgJSON: DeployRequest): Promise<string[]> => {
    let parsedLines = (
        await filesToLines(
            msgJSON.repos.map(repo =>
                isMultiRepo(msgJSON) ? `tmp/${msgJSON.deployId}/${repo.repo}/orgInit.sh` : `tmp/${msgJSON.deployId}/orgInit.sh`
            )
        )
    )
        .map(line => (msgJSON.repos.every(repo => repo.whitelisted) ? line : securityAssertions(line)))
        .filter(line => !isByoo(msgJSON) || byooFilter(line))
        .map(line => lineCorrections(line, msgJSON))
        .map(line => jsonify(line));

    // non line-level fixes for org:create
    if (isByoo(msgJSON)) {
        // special auth scenario for byoo user
        parsedLines.unshift(
            `sfdx force:config:set defaultdevhubusername= defaultusername='${msgJSON.byoo.accessToken}' instanceUrl='${msgJSON.byoo.instanceUrl}' --json`
        );
    }

    if (!isByoo(msgJSON) && isMultiRepo(msgJSON)) {
        // remove all the creates and put it at the beginning
        parsedLines = [
            `sfdx force:org:create -f config/project-scratch-def.json -d ${getMaxDays(parsedLines)} -s --json`,
            ...parsedLines.filter(line => !line.includes('org:create'))
        ];
    }

    if (isMultiRepo(msgJSON)) {
        parsedLines = multiOrgCorrections(parsedLines);
    }

    return parsedLines;
};

export { lineParse, jsonify, securityAssertions, byooFilter, getMaxDays, multiOrgCorrections };
