import logger from 'heroku-logger';

import { OpenResult } from './types';
import { isLocal } from './amIlocal';
import { processWrapper } from './processWrapper';
import { exec } from './execProm';

const utilities = {
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
        if (input.result.url) {
            input.result.url = input.result.url.replace('.com//secur/', '.com/secur/');
        }
        return input;
    }
};

export { utilities };
