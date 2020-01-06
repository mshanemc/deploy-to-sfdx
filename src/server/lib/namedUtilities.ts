import { PoolConfig, ProjectJSON } from './types';
import * as crypto from 'crypto';
import { shellSanitize } from './shellSanitize';

const randomValueHex = (len: number): string =>
    crypto
        .randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters

const randomCharactersInDeployId = 2;

const getPoolName = (pool: PoolConfig): string => {
    if (pool.branch) {
        return `${pool.user}.${pool.repo}.${pool.branch}`;
    }
    return `${pool.user}.${pool.repo}`;
};

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

export { getPoolName, getPackageDirsFromFile, getDeployId };
