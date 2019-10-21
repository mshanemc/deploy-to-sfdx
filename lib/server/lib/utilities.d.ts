import { deployRequest, poolConfig, openResult } from './types';
declare const utilities: {
    getKey: (msgJSON: deployRequest) => Promise<string>;
    getPoolConfig: () => Promise<poolConfig[]>;
    getPool: (username: string, repo: string) => Promise<poolConfig>;
    runHerokuBuilder: () => void;
    getPoolDeployerCommand: () => string;
    checkHerokuAPI: () => boolean;
    loggerFunction: (result: {
        stdout: string;
        stderr: string;
    }) => void;
    urlFix: (input: openResult) => openResult;
    getCloneCommand: (depReq: deployRequest) => string;
    getArg: (cmd: string, parameter: string) => string;
};
export { utilities };
