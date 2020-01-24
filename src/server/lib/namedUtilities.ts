/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import * as crypto from 'crypto';
import request from 'request-promise-native';

import { PoolConfig, ProjectJSON, DeployRequest, DeployRequestRepo, PoolConfigDeprecated } from './types';
import { shellSanitize } from './shellSanitize';
import { processWrapper } from './processWrapper';

const randomCharactersInDeployId = 2;

const randomValueHex = (len: number): string =>
    crypto
        .randomBytes(Math.ceil(len / randomCharactersInDeployId))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters

const getKeyFromRepos = (repos: DeployRequestRepo[], separator = '.'): string =>
    repos
        .map(item =>
            item.branch ? `${item.username}${separator}${item.repo}${separator}${item.branch}` : `${item.username}${separator}${item.repo}`
        )
        .join(separator);

const getPoolName = (pool: PoolConfig): string => getKeyFromRepos(pool.repos);

const getPackageDirsFromFile = (projectJSON: ProjectJSON): string => {
    const packageDirs = projectJSON.packageDirectories.map(dir => dir.path);
    packageDirs.forEach(dir => {
        if (!shellSanitize(dir)) {
            throw new Error(`security error on projectJSON: ${dir}`);
        }
    });
    return packageDirs.join(',');
};

const getDeployId = (username: string, repo: string): string =>
    encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}${randomValueHex(randomCharactersInDeployId)}`);

const getCloneCommands = (depReq: DeployRequest): string[] => {
    if (depReq.repos.length === 1) {
        return [
            `git clone -b ${depReq.repos[0].branch ?? 'master'} --single-branch https://github.com/${depReq.repos[0].username}/${
                depReq.repos[0].repo
            }.git ${depReq.deployId}`
        ];
    }
    return depReq.repos.map(
        repo =>
            `git clone -b ${repo.branch ?? 'master'} --single-branch https://github.com/${repo.username}/${repo.repo}.git ${depReq.deployId}/${
                repo.repo
            }`
    );
};

const isMultiRepo = (depReq: DeployRequest): boolean => {
    if (!depReq.repos) {
        return false;
    } else {
        return depReq.repos.length > 1;
    }
};

const isByoo = (depReq: DeployRequest): boolean => !!depReq.byoo;

const getArg = (cmd: string, parameter: string): string => {
    cmd = cmd.concat(' ');
    const bufferedParam = ' '.concat(parameter).concat(' ');
    // takes a command line command and removes a parameter.  Make noarg true if it's a flag (parameter with no arguments), like sfdx force:org:create -s

    // ex:
    // cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
    // parameter = '-a'

    // quickly return if it doesn't exist
    if (!cmd.includes(bufferedParam)) {
        return undefined;
    } else {
        // find the string
        const paramStartIndex = cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;

        const paramEndIndex = paramStartIndex + parameter.length - 1; // because there'll be a space, and because origin
        const paramValueStart = paramEndIndex + 2;
        let paramValueEnd;
        // if it starts with a ` or ' or " we need to find the other end.  Otherwise, it's a space
        // eslint-disable-next-line quotes
        if (cmd.charAt(paramValueStart) === '"' || cmd.charAt(paramValueStart) === "'" || cmd.charAt(paramValueStart) === '`') {
            // logger.debug(`it is a quoted string starting with ${cmd.charAt(paramValueStart)}`);
            const quoteEnd = cmd.indexOf(cmd.charAt(paramValueStart), paramValueStart + 1);
            if (cmd.charAt(quoteEnd + 1) === ' ') {
                paramValueEnd = quoteEnd;
            } else {
                paramValueEnd = cmd.indexOf(' ', quoteEnd + 1) - 1;
            }
        } else {
            // normal type with a space
            paramValueEnd = cmd.indexOf(' ', paramValueStart) - 1;
        }
        return cmd.substring(paramValueStart, paramValueEnd + 1).trim();
    }
};

const getPoolKey = (msgJSON: DeployRequest, separator = '.'): string => {
    if (!msgJSON.repos || msgJSON.repos.length === 0) {
        throw new Error('msg does not have repos');
    }

    // we prefer repos over single-properties, but will use them as a temporary fallback
    return getKeyFromRepos(msgJSON.repos, separator);
};

const getPoolConfig = async (): Promise<PoolConfig[]> => {
    if (!processWrapper.POOLCONFIG_URL) {
        return [];
    }
    try {
        const pools = JSON.parse(await request(processWrapper.POOLCONFIG_URL)) as PoolConfigDeprecated[];
        return pools.map(pool => poolConversion(pool));
    } catch (error) {
        throw new Error(error);
    }
};

const poolConversion = (oldPool: PoolConfigDeprecated): PoolConfig => {
    // remove stuff we no longer use
    const newPool: PoolConfig = {
        lifeHours: oldPool.lifeHours,
        quantity: oldPool.quantity
    };
    if (oldPool.repos) {
        newPool.repos = oldPool.repos;
    } else {
        newPool.repos = [
            {
                username: oldPool.username,
                repo: oldPool.repo,
                branch: oldPool.branch,
                whitelisted: true,
                source: 'github'
            }
        ];
    }
    return newPool;
};

export { getPoolName, getPackageDirsFromFile, getDeployId, getCloneCommands, isMultiRepo, isByoo, getArg, getPoolKey, getPoolConfig };
