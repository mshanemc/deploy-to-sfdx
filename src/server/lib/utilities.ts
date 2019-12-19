import logger from 'heroku-logger';
import request from 'request-promise-native';

import { DeployRequest, PoolConfig, OpenResult } from './types';
import { isLocal } from './amIlocal';
import { processWrapper } from './processWrapper';

const exec = require('child_process').exec;

const utilities = {
    getKey: async (msgJSON: DeployRequest): Promise<string> => {
        if (!msgJSON.username) {
            throw new Error('msg does not have username');
        }
        if (!msgJSON.repo) {
            throw new Error('msg does not have repo');
        }

        let key = `${msgJSON.username}.${msgJSON.repo}`;
        if (msgJSON.branch) {
            key = `${msgJSON.username}.${msgJSON.repo}.${msgJSON.branch}`;
        }
        return key;
    },

    getPoolConfig: async (): Promise<PoolConfig[]> => {
        // TODO: fallback as a singleton?
        if (!processWrapper.POOLCONFIG_URL) {
            return [];
        }
        try {
            return JSON.parse(await request(processWrapper.POOLCONFIG_URL));
        } catch (error) {
            throw new Error(error);
        }
    },

    getPool: async (username: string, repo: string): Promise<PoolConfig> => {
        const pools = await module.exports.getPoolConfig();
        if (!pools || !pools.find) {
            return undefined;
        }

        const foundPool: PoolConfig = pools.find(pool => pool.user === username && pool.repo === repo);
        return foundPool;
    },

    runHerokuBuilder: (): void => {
        if (processWrapper.HEROKU_API_KEY && processWrapper.HEROKU_APP_NAME && !isLocal()) {
            exec(`heroku run:detached oneoffbuilder -a ${processWrapper.HEROKU_APP_NAME}`);
        } else if (isLocal()) {
            logger.debug('run one-off dynos via heroku local');
            exec('heroku local oneoffbuilder');
        } else {
            logger.warn('no heroku api key. not running one-off dynos');
        }
    },

    getPoolDeployerCommand: (): string => {
        if (processWrapper.HEROKU_API_KEY && processWrapper.HEROKU_APP_NAME && !isLocal()) {
            return `heroku run:detached pooldeployer -a ${processWrapper.HEROKU_APP_NAME}`;
        } else if (isLocal()) {
            logger.debug('run poolbuilder dynos via heroku local');
            return 'heroku local pooldeployer';
        } else {
            logger.warn('unable to run pooldeployers...missing api key or app name');
            return undefined;
        }
    },

    checkHerokuAPI: (): boolean => {
        // we allow not to exist if running locally
        if (processWrapper.HEROKU_API_KEY || isLocal()) {
            return true;
        } else {
            throw new Error('HEROKU_API_KEY is not defined!');
        }
    },

    loggerFunction: (result: { stdout: string; stderr: string }): void => {
        if (result.stdout) {
            logger.debug(result.stdout);
        }
        if (result.stderr) {
            logger.debug(result.stderr);
        }
    },

    // fix double // inside a url by sfdx cli force:org:open
    urlFix: (input: OpenResult): OpenResult => {
        if (input.result.url && input.result.url.includes('.com//secur/')) {
            // logger.warn(`multiple slash in open url ${input.result.url}`);
            input.result.url = input.result.url.replace('.com//secur/', '.com/secur/');
        }
        return input;
    },

    getCloneCommand: (depReq: DeployRequest): string =>
        `git clone -b ${depReq.branch || 'master'} --single-branch https://github.com/${depReq.username}/${depReq.repo}.git ${depReq.deployId}`,

    getArg: (cmd: string, parameter: string): string => {
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
    }
};

export { utilities };
