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

    // fix double // inside a url by sfdx cli force:org:open
    urlFix: (input: OpenResult): OpenResult => {
        if (input.result.url && input.result.url.includes('.com//secur/')) {
            // logger.warn(`multiple slash in open url ${input.result.url}`);
            input.result.url = input.result.url.replace('.com//secur/', '.com/secur/');
        }
        return input;
    }
};

export { utilities };
