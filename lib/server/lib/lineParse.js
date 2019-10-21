"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const readline = __importStar(require("readline"));
const shellSanitize_1 = require("./shellSanitize");
const argStripper_1 = require("./argStripper");
const lineParse = function (msgJSON) {
    heroku_logger_1.default.debug('lineParse: started');
    return new Promise((resolve, reject) => {
        const parsedLines = [];
        readline
            .createInterface({
            input: fs.createReadStream(`tmp/${msgJSON.deployId}/orgInit.sh`),
            terminal: false
        })
            .on('line', (line) => {
            line = line.trim();
            if (line && line.length > 0 && !line.startsWith('#!/bin/bash') && !line.startsWith('#')) {
                heroku_logger_1.default.debug(`lineParse: Line: ${line}`);
                if (msgJSON.whitelisted) {
                    parsedLines.push(jsonify(line));
                }
                else if (!shellSanitize_1.shellSanitize(line)) {
                    const errorMessage = `ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${line}`;
                    heroku_logger_1.default.error(errorMessage, msgJSON);
                    reject(errorMessage);
                }
                else if (line.includes('-u ')) {
                    heroku_logger_1.default.debug('lineParse: found a -u in a command line');
                    const errorMessage = `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${line}`;
                    heroku_logger_1.default.error(errorMessage, msgJSON);
                    reject(errorMessage);
                }
                else if (!line.startsWith('sfdx ') && !line.startsWith('#')) {
                    const errorMessage = `ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${line}`;
                    heroku_logger_1.default.error(errorMessage, msgJSON);
                    reject(errorMessage);
                }
                else {
                    heroku_logger_1.default.debug('lineParse: line pushed');
                    line = `${argStripper_1.argStripper(line, '--json', true)} --json`;
                    parsedLines.push(jsonify(line));
                }
            }
        })
            .on('close', () => {
            heroku_logger_1.default.debug('lineParse: closed with lines', parsedLines);
            resolve(parsedLines.filter(line => line !== ''));
        });
    });
};
exports.lineParse = lineParse;
const jsonify = (line) => {
    if (line.startsWith('sfdx ')) {
        return `${argStripper_1.argStripper(line, '--json', true)} --json`;
    }
    else {
        return line;
    }
};
exports.jsonify = jsonify;
