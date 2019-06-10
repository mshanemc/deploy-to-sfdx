"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shellSanitize = function (input) {
    const evilCharacters = [';', '<', '>', '|', '?', '*', '[', ']', '$', '\\', '(', ')', '{', '}', '\'', '&&', '||', '&', '=', '`'];
    let ok = true;
    evilCharacters.forEach((punk) => {
        if (input.includes(punk)) {
            ok = false;
        }
    });
    return ok;
};
exports.shellSanitize = shellSanitize;
const filterAlphaHypenUnderscore = function (input) {
    const regex = /([A-Za-z0-9\-\_]+)/g;
    if (input.length === input.match(regex)[0].length) {
        return input;
    }
    else {
        throw new Error(`invalid characters in ${input}`);
    }
};
exports.filterAlphaHypenUnderscore = filterAlphaHypenUnderscore;
