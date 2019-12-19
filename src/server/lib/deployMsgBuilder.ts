import logger from 'heroku-logger';
import { DeployRequest } from './types';
import { shellSanitize, filterAlphaHypenUnderscore } from './shellSanitize';
import { checkWhitelist } from './checkWhitelist';
import { getDeployId } from './namedUtilities';
import ua from 'universal-analytics';

import { processWrapper } from './processWrapper';

const deployMsgBuilder = function(req): DeployRequest {
    // check for exploits
    const query = req.query;

    for (const prop in query) {
        if (!shellSanitize(query[prop])) {
            throw new Error(`unsafe query parameter ${prop}`);
        }
    }

    if (!query.template || !query.template.includes('https://github.com/')) {
        throw 'There should be a github repo in that url.  Example: /launch?template=https://github.com/you/repo';
    }

    const template = query.template;
    const path = template.replace('https://github.com/', '');
    const username = filterAlphaHypenUnderscore(path.split('/')[0]);
    const repo = filterAlphaHypenUnderscore(path.split('/')[1]);

    const deployId = getDeployId(username, repo);
    logger.debug(`deployMsgBuilder: template is ${template}`);

    const message: DeployRequest = {
        template,
        path,
        username,
        repo,
        deployId,
        createdTimestamp: new Date(),
        whitelisted: checkWhitelist(username, repo)
    };

    if (req.byoo) {
        message.byoo = req.byoo;
    }

    if (processWrapper.UA_ID) {
        message.visitor = ua(processWrapper.UA_ID);
    }

    if (query.email) {
        message.email = query.email;
    }

    if (req.body && req.body.UserEmail) {
        if (shellSanitize(req.body.UserEmail)) {
            message.email = req.body.UserEmail;
        } else {
            throw new Error(`invalid email address in form post ${req.body.UserEmail}`);
        }
    }

    if (query.firstname) {
        message.firstname = query.firstname;
    }

    if (query.lastname) {
        message.lastname = query.lastname;
    }

    if (query.pool) {
        message.pool = true;
    }

    if (path.includes('/tree/')) {
        // we're dealing with a branch.  Only allow alphanumeric, hyphen, underscore
        message.branch = filterAlphaHypenUnderscore(path.split('/tree/')[1]);
    }

    logger.debug('deployMsgBuilder: done', message);
    return message;
};

export { deployMsgBuilder };
