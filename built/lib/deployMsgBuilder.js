"use strict";
const logger = require("heroku-logger");
const deployMsgBuilder = function (query) {
    const template = query.template;
    const path = template.replace('https://github.com/', '');
    const username = path.split('/')[0];
    const repo = path.split('/')[1];
    const deployId = encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}`);
    logger.debug(`template is ${template}`);
    const message = {
        template,
        path,
        username,
        repo,
        deployId
    };
    if (query.email) {
        message.email = query.email;
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
        message.branch = path.split('/tree/')[1];
    }
    const whitelist1 = process.env.GITHUB_USERNAME_WHITELIST;
    const whitelist2 = process.env.GITHUB_REPO_WHITELIST;
    logger.debug(`whitelist1 is ${whitelist1}`);
    logger.debug(`whitelist2 is ${whitelist2}`);
    if (whitelist1) {
        whitelist1.split(',').forEach((username) => {
            if (username.trim() === message.username) {
                message.whitelisted = true;
                logger.debug('hit whitelist from username');
            }
        });
    }
    if (whitelist2) {
        whitelist2.split(',').forEach((repo) => {
            logger.debug(`checking whitelist 2 element: ${repo}`);
            if (repo.trim().split('/')[0] === message.username && repo.trim().split('/')[1] === message.repo) {
                message.whitelisted = true;
                logger.debug('hit whitelist from username/repo');
            }
        });
    }
    logger.debug('deploy message built');
    logger.debug(JSON.stringify(message));
    return message;
};
module.exports = deployMsgBuilder;
