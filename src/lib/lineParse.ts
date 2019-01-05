import * as fs from 'fs';
import * as logger from 'heroku-logger';
import * as readline from 'readline';

import * as utilities from './utilities';
import * as redisPub from './redisNormal';
import * as shellSanitize from './shellSanitize';
import * as argStripper from './argStripper';

import { deployRequest } from './types';

const ex = 'deployMsg';

const lineParse = function (msgJSON: deployRequest, visitor): Promise<string[]>{
	logger.debug('line parsing started');

	return new Promise( (resolve, reject) => {

		const parsedLines = [];
		let errorMessage;

		const rl = readline.createInterface({
			input: fs.createReadStream(`tmp/${msgJSON.deployId}/orgInit.sh`),
			terminal: false
		}).on('line', (line:string) => {
			logger.debug(`Line: ${line}`);
			if (msgJSON.whitelisted){
				// if the user or repo is on the whitelist, we'll let you execute whatever you like, except empty lines!
				if (line && line.includes('sfdx ') && !line.startsWith('#!/bin/bash') && !line.startsWith('#')){
					// TODO: handling for & at the end of line for background runs
					line = `${argStripper(line, '--json', true)} --json`;
					parsedLines.push(line);
				}
			} else if (!shellSanitize(line)) {
				// otherwise, we're goign to inspect your code very carefully
				errorMessage = `ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${line}`
				visitor.event('Repo Problems', 'line with semicolons', msgJSON.template).send();
				rl.close();
			} else if (!line) {
				logger.debug('empty line');
			} else if (line.startsWith('#!/bin/bash')) {
				logger.debug('bash line.  Ignoring!');
			} else if ( line.includes('-u ') && !line.includes('sfdx shane:org:create')) {
				logger.debug('found a -u in a command line');
				errorMessage = `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${line}`;
				visitor.event('Repo Problems', 'line with -u', msgJSON.template).send();
				rl.close();
			} else if (!line.startsWith('sfdx') && !line.startsWith('#')) {
				errorMessage = `ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${line}`;
				visitor.event('Repo Problems', 'non-sfdx line', msgJSON.template).send();
				rl.close();
			} else {
				// it's an OK line.
				logger.debug('line pushed');

				// json-ify every line
				line = `${argStripper(line, '--json', true)} --json`
				parsedLines.push(line);
			}
		}).on('close', () => {
			// you have all the parsed lines
			logger.debug('in the close event');
			logger.debug(JSON.stringify(parsedLines));
			if (!errorMessage) {
				resolve(parsedLines);
			} else {
				reject(errorMessage);
			}
		});
	});
};

export = lineParse;