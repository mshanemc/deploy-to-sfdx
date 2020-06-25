import logger from 'heroku-logger';
import { DeployRequest } from './types';
import { shellSanitize, filterAlphaHypenUnderscore } from './shellSanitize';
import { checkWhitelist } from './checkWhitelist';
import { getDeployId } from './namedUtilities';
import ua from 'universal-analytics';

import { processWrapper } from './processWrapper';

const validateQuery = (query): void => {
    for (const prop in query) {
        if (!shellSanitize(query[prop])) {
            throw new Error(`unsafe query parameter ${prop}`);
        }
    }

    if (!query.template) {
        throw 'There should be a github repo in that url.  Example: /launch?template=https://github.com/you/repo';
    }
};

const makesTemplates = (templateParam): string[] => {
    if (processWrapper.SINGLE_REPO) {
        return [processWrapper.SINGLE_REPO];
    }
    if (Array.isArray(templateParam)) {
        return templateParam;
    }
    // now it'll definitely be an array!
    return [templateParam];
};

const deployMsgBuilder = async (req): Promise<DeployRequest> => {
    validateQuery(req.query); // check for exploits
    const repos = await Promise.all(
        makesTemplates(req.query.template).map(async (template) => {
            logger.debug(`deployMsgBuilder: template is ${template}`);
            const path = template.replace('https://github.com/', '');
            const username = filterAlphaHypenUnderscore(path.split('/')[0]).toLowerCase();
            const repo = filterAlphaHypenUnderscore(path.split('/')[1]).toLowerCase();
            return {
                source: 'github',
                username,
                repo,
                branch: path.includes('/tree/') ? filterAlphaHypenUnderscore(path.split('/tree/')[1]) : undefined,
                whitelisted: await checkWhitelist(username, repo)
            };
        })
    );

    const message: DeployRequest = {
        deployId: getDeployId(repos[0].username, repos[0].repo),
        createdTimestamp: new Date(),
        repos,
        byoo: req.byoo,
        noPool: req.query.nopool,
        visitor: processWrapper.UA_ID ? ua(processWrapper.UA_ID) : undefined,
        email: req.query.email,
        firstname: req.query.firstname,
        lastname: req.query.lastname,
        pool: req.query.pool
    };

    if (req.query.email) {
        message.email = req.query.email;
    }

    // posting from trial form
    if (req.body && req.body.UserEmail) {
        if (shellSanitize(req.body.UserEmail)) {
            message.email = req.body.UserEmail;
        } else {
            throw new Error(`invalid email address in form post ${req.body.UserEmail}`);
        }
    }

    logger.debug('deployMsgBuilder: done', message);
    return message;
};

export { deployMsgBuilder };
