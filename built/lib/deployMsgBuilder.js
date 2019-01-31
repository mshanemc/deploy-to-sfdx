"use strict";
const logger = require("heroku-logger");
const shellSanitize = require("./shellSanitize");
const ua = require("universal-analytics");
const deployMsgBuilder = function (req) {
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
    const username = path.split('/')[0];
    const repo = path.split('/')[1];
    const deployId = encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}`);
    logger.debug(`deployMsgBuilder: template is ${template}`);
    const message = {
        template,
        path,
        username,
        repo,
        deployId,
        createdTimestamp: new Date()
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
        }
        else {
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
        message.branch = path.split('/tree/')[1];
    }
    const whitelist1 = process.env.GITHUB_USERNAME_WHITELIST;
    const whitelist2 = process.env.GITHUB_REPO_WHITELIST;
    if (whitelist1) {
        whitelist1.split(',').forEach((username) => {
            if (username.trim() === message.username) {
                message.whitelisted = true;
            }
        });
    }
    if (whitelist2) {
        whitelist2.split(',').forEach((repo) => {
            logger.debug(`checking whitelist 2 element: ${repo}`);
            if (repo.trim().split('/')[0] === message.username &&
                repo.trim().split('/')[1] === message.repo) {
                message.whitelisted = true;
            }
        });
    }
    logger.debug('deployMsgBuilder: done', message);
    return message;
};
module.exports = deployMsgBuilder;
