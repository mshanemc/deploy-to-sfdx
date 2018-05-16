const logger = require('heroku-logger');

// takes a command line command and removes a parameter.  Make noarg true if it's a flag (parameter with no arguments), like sfdx force:org:create -s

// ex:
// cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
// parameter = '-a'

module.exports = function(cmd, parameter, noarg){


	// add a space to the end to simplify things
	cmd = cmd.concat(' ');

	// quickly return if it doesn't exist
	const bufferedParam = ' '.concat(parameter).concat(' ');
	if (!cmd.includes(bufferedParam)){
		logger.debug('param not in command');
		return cmd.trim();
	} else {
		let output = cmd;
		if (noarg){
			// just remove the thing!
			output = cmd.replace(' '.concat(parameter).concat(' '), ' ');
		} else {
			// find the string
			const paramStartIndex = cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;

			// console.log(`param starts at ${paramStartIndex}`);
			const paramEndIndex = paramStartIndex + parameter.length - 1; // because there'll be a space, and because origin
			// console.log(`param ends at ${paramEndIndex}`);
			const paramValueStart = paramEndIndex + 2;
			// console.log(`value starts at ${paramValueStart}`);
			let paramValueEnd;
			// if it starts with a ` or ' or " we need to find the other end.  Otherwise, it's a space
			if (cmd.charAt(paramValueStart) === '"' || cmd.charAt(paramValueStart) === '\'' || cmd.charAt(paramValueStart) === '`'){
				logger.debug(`it is a quoted string starting with ${cmd.charAt(paramValueStart)}`);
				paramValueEnd = cmd.indexOf(cmd.charAt(paramValueStart), paramValueStart+1);
			} else {
				// normal type with a space
				paramValueEnd = cmd.indexOf(' ', paramValueStart)-1;
			}
			// console.log(`value ends at ${paramValueEnd}`);
			output = cmd.slice(0, paramStartIndex-1).concat(' ').concat(cmd.slice(paramValueEnd+2));

		}

		logger.debug(`converted ${cmd} to ${output}`);

		// const cmdParts = cmd.split(' ');
		// // join back anything inside a backtick
		// const cmdParts2 = [];
		// let skip = 0;
		// for (let s of cmdParts) {
		// 	// if it's a argument that should have a parameter
		// 	if (s === parameter && !noarg) {
		// 		skip = 2;
		// 	} else if (s === parameter && noarg){
		// 		// if it's a argument that has no parameter
		// 		skip = 1;
		// 	} else if (skip == 0){
		// 		// only push if we're not supposed to skip
		// 		cmdParts2.push(s);
		// 	}
		// 	if (skip>0) { skip--; }
		// }
		// const output = cmdParts2.join(' ');

		return output.trim();
	}

};