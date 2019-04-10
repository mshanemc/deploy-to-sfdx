import * as fs from 'fs';
import * as readline from 'readline';

import { lineParserResult } from './types';

// returns the open command after making changes to local FS (removing the line from the file)
const poolParse = function (path: string): Promise<lineParserResult> {

	let parsedLines = [];

	let openLine;
	let passwordLine;

	return new Promise(function (resolve, reject) {
		const rl = readline.createInterface({
			input: fs.createReadStream(path),
			terminal: false
		}).on('line', (line) => {
			if (line.startsWith('sfdx force:org:open')){
				openLine = line;
			} else if (line.startsWith('sfdx force:user:password:generate') || line.startsWith('sfdx shane:user:password:set') ) {
				passwordLine = line;
			} else {
				parsedLines.push(line);
			}
		}).on('close', () => {
			fs.writeFile(path, parsedLines.join('\n'), () => {
				const result: lineParserResult = {
					openLine,
					passwordLine
				};
				resolve(result);
			});
		});
	});
};

export { poolParse };