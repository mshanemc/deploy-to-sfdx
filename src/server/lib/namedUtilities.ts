import { poolConfig, ProjectJSON } from './types';

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

export { getPoolName, getPackageDirsFromFile };
