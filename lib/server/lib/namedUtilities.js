"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getPoolName = (pool) => {
    if (pool.branch) {
        return `${pool.user}.${pool.repo}.${pool.branch}`;
    }
    return `${pool.user}.${pool.repo}`;
};
exports.getPoolName = getPoolName;
