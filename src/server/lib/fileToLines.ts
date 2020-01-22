import logger from 'heroku-logger';
import * as readline from 'readline';
import * as fs from 'fs-extra';

const fileToLines = (filePath: string): Promise<string[]> => {
    const parsedLines = [];
    return new Promise(resolve => {
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
            .on('close', () => {
                // you have all the parsed lines
                logger.debug(`fileToLines: Lines from ${filePath}: ${parsedLines.join(',')}`);
                resolve(parsedLines.filter(line => line !== ''));
            });
    });
};

const filesToLines = async (filePaths: string[]): Promise<string[]> =>
    [].concat(...(await Promise.all(filePaths.map(filePath => fileToLines(filePath)))));

export { fileToLines, filesToLines };
