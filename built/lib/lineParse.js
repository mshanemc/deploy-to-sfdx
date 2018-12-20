"use strict";
const fs = require("fs");
const logger = require("heroku-logger");
const readline = require("readline");
const shellSanitize = require("./shellSanitize");
const argStripper = require("./argStripper");
const ex = 'deployMsg';
const lineParse = function (msgJSON, visitor) {
    logger.debug('line parsing started');
    return new Promise((resolve, reject) => {
        const parsedLines = [];
        let errorMessage;
        const rl = readline.createInterface({
            input: fs.createReadStream(`tmp/${msgJSON.deployId}/orgInit.sh`),
            terminal: false
        }).on('line', (line) => {
            logger.debug(`Line: ${line}`);
            if (msgJSON.whitelisted) {
                if (line && line.includes('sfdx ') && !line.startsWith('#!/bin/bash') && !line.startsWith('#')) {
                    if (line.endsWith(' &')) {
                        line = line.substr(0, line.length);
                    }
                    else {
                        line = `${argStripper(line, '--json', true)} --json`;
                    }
                    parsedLines.push(line);
                }
            }
            else if (!shellSanitize(line)) {
                errorMessage = `ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${line}`;
                visitor.event('Repo Problems', 'line with semicolons', msgJSON.template).send();
                rl.close();
            }
            else if (!line) {
                logger.debug('empty line');
            }
            else if (line.startsWith('#!/bin/bash')) {
                logger.debug('bash line.  Ignoring!');
            }
            else if (line.includes('-u ') && !line.includes('sfdx shane:org:create')) {
                logger.debug('found a -u in a command line');
                errorMessage = `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${line}`;
                visitor.event('Repo Problems', 'line with -u', msgJSON.template).send();
                rl.close();
            }
            else if (!line.startsWith('sfdx') && !line.startsWith('#')) {
                errorMessage = `ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${line}`;
                visitor.event('Repo Problems', 'non-sfdx line', msgJSON.template).send();
                rl.close();
            }
            else {
                logger.debug('line pushed');
                line = `${argStripper(line, '--json', true)} --json`;
                parsedLines.push(line);
            }
        }).on('close', () => {
            logger.debug('in the close event');
            logger.debug(JSON.stringify(parsedLines));
            if (!errorMessage) {
                resolve(parsedLines);
            }
            else {
                reject(errorMessage);
            }
        });
    });
};
module.exports = lineParse;
