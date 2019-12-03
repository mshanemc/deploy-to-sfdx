import * as fs from 'fs';
import * as readline from 'readline';

import { lineParserResult } from './types';

// returns the open command after making changes to local FS (removing the line from the file)
const poolParse = function(path: string): Promise<lineParserResult> {
    let parsedLines = [];

    let openLine: string;

    return new Promise(function(resolve, reject) {
        readline
            .createInterface({
                input: fs.createReadStream(path),
                terminal: false
            })
            .on('line', line => {
                if (line.startsWith('sfdx force:org:open')) {
                    openLine = line;
                } else {
                    parsedLines.push(line);
                }
            })
            .on('close', () => {
                fs.writeFile(path, parsedLines.join('\n'), () => {
                    const result: lineParserResult = {
                        openLine
                    };
                    resolve(result);
                });
            });
    });
};

export { poolParse };
