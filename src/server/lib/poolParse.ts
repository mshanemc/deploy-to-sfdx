import * as fs from 'fs';
import * as readline from 'readline';

import { LineParserResult } from './types';

// returns the open command after making changes to local FS (removing the line from the file)
const poolParse = function(path: string): Promise<LineParserResult> {
    const parsedLines = [];

    let openLine: string;

    return new Promise(function(resolve) {
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
                    const result: LineParserResult = {
                        openLine
                    };
                    resolve(result);
                });
            });
    });
};

export { poolParse };
