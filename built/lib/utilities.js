"use strict";
const logger = require("heroku-logger");
const request = require("request-promise-native");
const exec = require('child_process').exec;
const utilities = {
    getKey: async (msgJSON) => {
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
    bufferKey: (content, deployId) => {
        const message = {
            deployId,
            content
        };
        return JSON.stringify(message);
    },
    getPoolConfig: async () => {
        if (!process.env.POOLCONFIG_URL) {
            return {};
        }
        try {
            return JSON.parse(await request(process.env.POOLCONFIG_URL));
        }
        catch (error) {
            throw new Error(error);
        }
    },
    getPool: async (username, repo) => {
        const pools = await module.exports.getPoolConfig();
        if (!pools || !pools.find) {
            return false;
        }
        const foundPool = pools.find(pool => pool.user === username && pool.repo === repo);
        if (!foundPool) {
            return false;
        }
        else {
            return foundPool;
        }
    },
    runHerokuBuilder: () => {
        if (process.env.HEROKU_API_KEY) {
            exec(`heroku run:detached oneoffbuilder -a ${process.env.HEROKU_APP_NAME}`);
        }
        else {
            logger.warn('no heroku api key. not running one-off dynos');
        }
    },
    checkHerokuAPI: () => {
        if (process.env.HEROKU_API_KEY || process.env.DEPLOYER_TESTING_ENDPOINT) {
            return true;
        }
        else {
            throw new Error('HEROKU_API_KEY is not defined!');
        }
    },
    loggerFunction: (result) => {
        if (result.stdout) {
            logger.debug(result.stdout);
        }
        if (result.stderr) {
            logger.debug(result.stderr);
        }
    },
    urlFix: (input) => {
        if (input.result.url && input.result.url.includes('.com//secur/')) {
            logger.warn(`multiple slash in open url ${input.result.url}`);
            input.result.url = input.result.url.replace('.com//secur/', '.com/secur/');
        }
        return input;
    },
    getArg: (cmd, parameter) => {
        cmd = cmd.concat(' ');
        const bufferedParam = ' '.concat(parameter).concat(' ');
        if (!cmd.includes(bufferedParam)) {
            return false;
        }
        else {
            const paramStartIndex = cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;
            const paramEndIndex = paramStartIndex + parameter.length - 1;
            const paramValueStart = paramEndIndex + 2;
            let paramValueEnd;
            if (cmd.charAt(paramValueStart) === '"' ||
                cmd.charAt(paramValueStart) === '\'' ||
                cmd.charAt(paramValueStart) === '`') {
                const quoteEnd = cmd.indexOf(cmd.charAt(paramValueStart), paramValueStart + 1);
                if (cmd.charAt(quoteEnd + 1) === ' ') {
                    paramValueEnd = quoteEnd;
                }
                else {
                    paramValueEnd = cmd.indexOf(' ', quoteEnd + 1) - 1;
                }
            }
            else {
                paramValueEnd = cmd.indexOf(' ', paramValueStart) - 1;
            }
            return cmd.substring(paramValueStart, paramValueEnd + 1).trim();
        }
    }
};
module.exports = utilities;
