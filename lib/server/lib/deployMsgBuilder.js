"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const shellSanitize_1 = require("./shellSanitize");
const checkWhitelist_1 = require("./checkWhitelist");
const universal_analytics_1 = __importDefault(require("universal-analytics"));
const crypto = __importStar(require("crypto"));
const randomCharactersInDeployId = 2;
const deployMsgBuilder = function (req) {
    const query = req.query;
    for (const prop in query) {
        if (!shellSanitize_1.shellSanitize(query[prop])) {
            throw new Error(`unsafe query parameter ${prop}`);
        }
    }
    if (!query.template || !query.template.includes('https://github.com/')) {
        throw 'There should be a github repo in that url.  Example: /launch?template=https://github.com/you/repo';
    }
    const template = query.template;
    const path = template.replace('https://github.com/', '');
    const username = shellSanitize_1.filterAlphaHypenUnderscore(path.split('/')[0]);
    const repo = shellSanitize_1.filterAlphaHypenUnderscore(path.split('/')[1]);
    const deployId = encodeURIComponent(`${username}-${repo}-${new Date().valueOf()}${randomValueHex(randomCharactersInDeployId)}`);
    heroku_logger_1.default.debug(`deployMsgBuilder: template is ${template}`);
    const message = {
        template,
        path,
        username,
        repo,
        deployId,
        createdTimestamp: new Date(),
        whitelisted: checkWhitelist_1.checkWhitelist(username, repo)
    };
    if (process.env.UA_ID) {
        message.visitor = universal_analytics_1.default(process.env.UA_ID);
    }
    if (query.email) {
        message.email = query.email;
    }
    if (req.body && req.body.UserEmail) {
        if (shellSanitize_1.shellSanitize(req.body.UserEmail)) {
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
        message.branch = shellSanitize_1.filterAlphaHypenUnderscore(path.split('/tree/')[1]);
    }
    heroku_logger_1.default.debug('deployMsgBuilder: done', message);
    return message;
};
exports.deployMsgBuilder = deployMsgBuilder;
const randomValueHex = (len) => {
    return crypto
        .randomBytes(Math.ceil(len / 2))
        .toString('hex')
        .slice(0, len);
};
