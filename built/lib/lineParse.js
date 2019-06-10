"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const logger = require("heroku-logger");
const readline = require("readline");
const shellSanitize_1 = require("./shellSanitize");
const argStripper = require("./argStripper");
const lineParse = function (msgJSON) {
    logger.debug('lineParse: started');
    return new Promise((resolve, reject) => {
        const parsedLines = [];
        const rl = readline
            .createInterface({
            input: fs.createReadStream(`tmp/${msgJSON.deployId}/orgInit.sh`),
            terminal: false
        })
            .on('line', (line) => {
            line = line.trim();
            if (line && line.length > 0 && !line.startsWith('#!/bin/bash') && !line.startsWith('#')) {
                logger.debug(`lineParse: Line: ${line}`);
                if (msgJSON.whitelisted) {
                    parsedLines.push(jsonify(line));
                }
                else if (!shellSanitize_1.shellSanitize(line)) {
                    const errorMessage = `ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${line}`;
                    logger.error(errorMessage, msgJSON);
                    reject(errorMessage);
                }
                else if (line.includes('-u ')) {
                    logger.debug('lineParse: found a -u in a command line');
                    const errorMessage = `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${line}`;
                    logger.error(errorMessage, msgJSON);
                    reject(errorMessage);
                }
                else if (!line.startsWith('sfdx') && !line.startsWith('#')) {
                    const errorMessage = `ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${line}`;
                    logger.error(errorMessage, msgJSON);
                    reject(errorMessage);
                }
                else {
                    logger.debug('lineParse: line pushed');
                    line = `${argStripper(line, '--json', true)} --json`;
                    parsedLines.push(jsonify(line));
                }
            }
        })
            .on('close', () => {
            logger.debug('lineParse: closed with lines', parsedLines);
            resolve(parsedLines.filter(line => line !== ''));
        });
    });
};
exports.lineParse = lineParse;
const jsonify = (line) => {
    if (line.startsWith('sfdx ')) {
        return `${argStripper(line, '--json', true)} --json`;
    }
    else {
        return line;
    }
};
exports.jsonify = jsonify;
