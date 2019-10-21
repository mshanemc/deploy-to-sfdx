"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const argStripper = function (cmd, parameter, noarg) {
    cmd = cmd.concat(' ');
    const bufferedParam = ' '.concat(parameter).concat(' ');
    if (!cmd.includes(bufferedParam)) {
        return cmd.trim();
    }
    let output = cmd;
    if (noarg) {
        output = cmd.replace(' '.concat(parameter).concat(' '), ' ');
    }
    else {
        const paramStartIndex = cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;
        const paramEndIndex = paramStartIndex + parameter.length - 1;
        const paramValueStart = paramEndIndex + 2;
        let paramValueEnd;
        if (cmd.charAt(paramValueStart) === '"' || cmd.charAt(paramValueStart) === "'" || cmd.charAt(paramValueStart) === '`') {
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
        output = cmd
            .slice(0, paramStartIndex - 1)
            .concat(' ')
            .concat(cmd.slice(paramValueEnd + 2));
    }
    heroku_logger_1.default.debug(`argStripper: converted ${cmd} to ${output}`);
    return output.trim();
};
exports.argStripper = argStripper;
