"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const poolParse = function (path) {
    let parsedLines = [];
    let openLine;
    let passwordLine;
    return new Promise(function (resolve, reject) {
        readline
            .createInterface({
            input: fs.createReadStream(path),
            terminal: false
        })
            .on('line', line => {
            if (line.startsWith('sfdx force:org:open')) {
                openLine = line;
            }
            else if (line.startsWith('sfdx force:user:password:generate') || line.startsWith('sfdx shane:user:password:set')) {
                passwordLine = line;
            }
            else {
                parsedLines.push(line);
            }
        })
            .on('close', () => {
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
