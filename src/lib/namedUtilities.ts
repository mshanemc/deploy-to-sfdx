import { poolConfig } from './types';

const getPoolName = (pool: poolConfig) => {
    if (pool.branch) {
        return `${pool.user}.${pool.repo}.${pool.branch}`;
    }
    return `${pool.user}.${pool.repo}`;
};

export { getPoolName };
