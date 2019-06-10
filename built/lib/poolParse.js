"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const readline = require("readline");
const poolParse = function (path) {
    let parsedLines = [];
    let openLine;
    let passwordLine;
    return new Promise(function (resolve, reject) {
        const rl = readline.createInterface({
            input: fs.createReadStream(path),
            terminal: false
        }).on('line', (line) => {
            if (line.startsWith('sfdx force:org:open')) {
                openLine = line;
            }
            else if (line.startsWith('sfdx force:user:password:generate') || line.startsWith('sfdx shane:user:password:set')) {
                passwordLine = line;
            }
            else {
                parsedLines.push(line);
            }
        }).on('close', () => {
            fs.writeFile(path, parsedLines.join('\n'), () => {
                const result = {
                    openLine,
                    passwordLine
                };
                resolve(result);
            });
        });
    });
};
exports.poolParse = poolParse;
