
// takes a command line command and removes a parameter.  Make noarg true if it's a flag (parameter with no arguments), like sfdx force:org:create -s

// ex:
// cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
// parameter = '-a'

module.exports = function(cmd, parameter, noarg){
	// quickly return if it doesn't exist
	if (!cmd.includes(parameter)){
		console.log('param not in command');
		return cmd;
	} else {
		const cmdParts = cmd.split(' ');
		const cmdParts2 = [];
		let skip = 0;
		for (let s of cmdParts) {
			// if it's a argument that should have a parameter
			if (s === parameter && !noarg) {
				skip = 2;
			} else if (s === parameter && noarg){
				// if it's a argument that has no parameter
				skip = 1;
			} else if (skip == 0){
				// only push if we're not supposed to skip
				cmdParts2.push(s);
			}
			if (skip>0) { skip--; }
		}
		const output = cmdParts2.join(' ');
		console.log(`converted ${cmd} to ${output}`);
		return output;
	}

};