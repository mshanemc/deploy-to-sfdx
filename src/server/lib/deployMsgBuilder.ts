import logger from 'heroku-logger';
import { DeployRequest, DeployRequestRepo } from './types';
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

const deployMsgBuilder = (req): DeployRequest => {
    validateQuery(req.query); // check for exploits
    const query = req.query;
    let templates = [];

    // now it'll definitely be an array!
    if (Array.isArray(query.template)) {
        templates = query.template;
    } else {
        templates.push(query.template);
    }

    const repos = [];

    for (const template of templates) {
        const path = template.replace('https://github.com/', '');

        logger.debug(`deployMsgBuilder: template is ${template}`);
        const username = filterAlphaHypenUnderscore(path.split('/')[0]).toLowerCase();
        const repo = filterAlphaHypenUnderscore(path.split('/')[1]).toLowerCase();
        const repoForDR: DeployRequestRepo = {
            source: 'github',
            username,
            repo,
            branch: path.includes('/tree/') ? filterAlphaHypenUnderscore(path.split('/tree/')[1]).toLowerCase() : undefined,
            whitelisted: checkWhitelist(username, repo)
        };
        repos.push(repoForDR);
    }

    const deployId = getDeployId(repos[0].username, repos[0].repo);

    const message: DeployRequest = {
        deployId,
        createdTimestamp: new Date(),
        repos
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

    logger.debug('deployMsgBuilder: done', message);
    return message;
};

export { deployMsgBuilder };
