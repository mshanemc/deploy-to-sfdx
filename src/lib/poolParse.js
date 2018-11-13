const fs = require('fs');
// const logger = require('heroku-logger');
const readline = require('readline');

// returns the open command after making changes to local FS (removing the line from the file)
module.exports = function (path) {

	let parsedLines = [];

	let output = {};

	return new Promise(function (resolve, reject) {
		const rl = readline.createInterface({
			input: fs.createReadStream(path),
			terminal: false
		}).on('line', (line) => {
			if (line.startsWith('sfdx force:org:open')){
				output.openLine = line;
			} else if (line.startsWith('sfdx force:user:password:generate') || line.startsWith('sfdx shane:user:password:set') ) {
				output.passwordLine = line;
			} else {
				parsedLines.push(line);
			}
		}).on('close', () => {
			fs.writeFile(path, parsedLines.join('\n'), () => {
				resolve(output);
			});
		});
	});
};