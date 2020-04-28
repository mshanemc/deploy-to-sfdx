import logger from 'heroku-logger';
import * as readline from 'readline';
import * as fs from 'fs-extra';
import { commandRewriter, getCommandsWithFileFlagsMap } from '../lib/flagTypeFromCommandHelp';

const fileToLines = (filePath: string): Promise<string[]> => {
    let parsedLines = [];
    return new Promise((resolve) => {
        readline
            .createInterface({
                input: fs.createReadStream(filePath),
                terminal: false
            })
            .on('line', (line: string) => {
                line = line.trim();
                if ((!line && line.length === 0) || line.startsWith('#!/bin/bash') || line.startsWith('#')) {
                    return; // just ignore the meaningless stuff;
                }
                parsedLines.push(line);
            })
            .on('close', async () => {
                // you have all the parsed lines
                // normal tmp/deployid/orgInit.sh.  multirepo: tmp/deployid/repo/orgInit.sh
                if (filePath.split('/').length > 3) {
                    // translate to base command, and if necessary, prepand the filepath to certain flag arguments
                    const commandMap = await getCommandsWithFileFlagsMap();
                    parsedLines = await Promise.all(parsedLines.map((line) => commandRewriter(filePath.split('/')[2], line, commandMap)));
                }
                logger.debug(`fileToLines: Lines from ${filePath}: ${parsedLines.join(',')}`);
                resolve(parsedLines.filter((line) => line !== ''));
            });
    });
};

const filesToLines = async (filePaths: string[]): Promise<string[]> =>
    [].concat(...(await Promise.all(filePaths.map((filePath) => fileToLines(filePath)))));

export { fileToLines, filesToLines };
