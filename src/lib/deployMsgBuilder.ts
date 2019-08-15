import * as logger from 'heroku-logger';
import { deployRequest } from './types';
import { shellSanitize, filterAlphaHypenUnderscore } from './shellSanitize';
import { checkWhitelist } from './checkWhitelist';

import * as ua from 'universal-analytics';
import * as crypto from 'crypto';

const randomCharactersInDeployId = 2;

const deployMsgBuilder = function(req): deployRequest {
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

    const deployId = encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}${randomValueHex(randomCharactersInDeployId)}`);

    logger.debug(`deployMsgBuilder: template is ${template}`);

    const message: deployRequest = {
        template,
        path,
        username,
        repo,
        deployId,
        createdTimestamp: new Date(),
        whitelisted: checkWhitelist(username, repo)
    };

    if (process.env.UA_ID) {
        message.visitor = ua(process.env.UA_ID);
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

export = deployMsgBuilder;

const randomValueHex = (len: number) => {
    return crypto
        .randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters
};
