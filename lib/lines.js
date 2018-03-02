const logger = require('heroku-logger');
const exec = require('child-process-promise').exec;
const bufferKey = require('./bufferKey');
const argStripper = require('./argStripper');

const ex = 'deployMsg';

module.exports = function (msgJSON, lines, redisPub, visitor) {
	this.msgJSON = msgJSON;
	this.lines = lines;
	this.redisPub = redisPub;
	this.visitor = visitor;

	this.runLines = async function runLines() {

		logger.debug('starting the line runs');
		for (let line of this.lines) {
			let localLine = line;
			logger.debug(localLine);
			// corrections and improvements for individual commands
			if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -r')) {
				localLine = `${localLine} -r --json`;
				logger.debug(`org open command : ${localLine}`);
				visitor.event('sfdx event', 'org open', this.msgJSON.template).send();
			}
			if (localLine.includes(':user:password') && !localLine.includes(' --json')) {
				localLine = `${localLine} --json`;
				logger.debug(`org password command : ${localLine}`);
				visitor.event('sfdx event', 'password gen', this.msgJSON.template).send();
			}
			// handle the msm plugin and the stock commmand
			if (localLine.includes(':org:create')) {
				// no aliases allowed to keep the deployer from getting confused between deployments
				localLine = argStripper(localLine, '--setalias');
				localLine = argStripper(localLine, '-a');
				localLine = `${argStripper(localLine, '--json', true)} --json`;
				logger.debug(`org create command : ${localLine}`);
				visitor.event('sfdx event', 'org creation', this.msgJSON.template).send();
			}
			if (localLine.includes('sfdx force:source:push') && !localLine.includes(' --json')) {
				localLine = `${localLine} --json`;
				logger.debug(`source push command : ${localLine}`);
				visitor.event('sfdx event', 'source push', this.msgJSON.template).send();
			}
			try {
				logger.debug(`running line-- ${localLine}`);
				let lineResult = await exec(localLine);
				if (lineResult.stdout) {
					logger.debug(lineResult.stdout);
					redisPub.publish(ex, bufferKey(lineResult.stdout, msgJSON.deployId));
				}
				if (lineResult.stderr) {
					logger.error(lineResult.stderr);
					redisPub.publish(ex, bufferKey(`ERROR ${lineResult.stderr}`, msgJSON.deployId));
					visitor.event('deploy error', this.msgJSON.template, lineResult.stderr).send();
				}
			} catch (err) {
				console.error('Error (lines.js): ', err);
				redisPub.publish(ex, bufferKey(`ERROR: ${err}`, msgJSON.deployId));
				visitor.event('deploy error', this.msgJSON.template, err).send();
			}

		}
	};
};
