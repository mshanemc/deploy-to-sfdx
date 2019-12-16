import { poolConfig, ProjectJSON } from './types';
import * as crypto from 'crypto';

const randomCharactersInDeployId = 2;

const getPoolName = (pool: poolConfig) => {
    if (pool.branch) {
        return `${pool.user}.${pool.repo}.${pool.branch}`;
    }
    return `${pool.user}.${pool.repo}`;
};

const getPackageDirsFromFile = (projectJSON: ProjectJSON) => {
    const packageDirs = projectJSON.packageDirectories.map(dir => dir.path);
    return packageDirs.join(',');
};

const getDeployId = (username: string, repo: string) => {
    return encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}${randomValueHex(randomCharactersInDeployId)}`);
};

const randomValueHex = (len: number) => {
    return crypto
        .randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters
};

export { getPoolName, getPackageDirsFromFile, getDeployId };
