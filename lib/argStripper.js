
// takes a command line command and removes a parameter.  Make noarg true if it's a flag (parameter with no arguments), like sfdx force:org:create -s

// ex:
// cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
// parameter = '-a'

module.exports = function(cmd, parameter, noarg){
	// quickly return if it doesn't exist
	if (!cmd.includes(parameter)){
		return cmd;
	} else {
		const cmdParts = cmd.split(' ');
		const cmdParts2 = [];
		let flagger = false;
		for (let s of cmdParts) {
			if (s === parameter && !noarg) {
				flagger = true;
			} else if (flagger) {
				flagger = false;
			} else {
				cmdParts2.push(s);
			}
		}
		const output = cmdParts2.join(' ');
		console.log(`converted ${cmd} to ${output}`);
		return output;
	}

};