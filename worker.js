// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/DF17integrationWorkshops
// heroku ps:exec -a hosted-scratch-qa --dyno=worker.1

console.log('I am a worker and I am up!');

const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');
const exec = require('child-process-promise').exec;
const readline = require('readline');
const fs = require('fs');
const util = require('util');

function bufferKey(content, deployId) {
	const message = {
		deployId,
		content
	};
	return new Buffer(JSON.stringify(message));
}

function logResult(result){
	if (result.stderr){
		console.log(result.stderr);
	}
	if (result.stdout){
		console.log(result.stdout);
	}
}


// save the key file
// exec(`cd tmp;echo ${process.env.JWTKEY}>server.key`)
const write = util.promisify(fs.writeFile);
write('/app/tmp/server.key', process.env.JWTKEY, 'utf8')
.then( (result) => {
	console.log(result);
	// do an exec to get auth'd to our standard sfdx hub
	return exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile /app/tmp/server.key --setdefaultdevhubusername -a hub`);
	}, (err) => console.log(err))
.then( (result) => {
	logResult(result);
	return exec('sfdx force:org:display -u hub');
})
.then((result) => {
	logResult(result);
	return exec('sfdx force:org:list');
})
.then( (result) => {
	logResult(result);
	return mq;
})
.then( (mqConn) => {
	let ok = mqConn.createChannel();
	ok = ok.then((ch) => {
		ch.assertQueue('deploys', { durable: true });
		ch.assertQueue('deployMessages',{ durable: true });
		ch.prefetch(1);

		// this consumer eats deploys, creates local folders, and chops up the tasks into steps
		ch.consume('deploys', (msg) => {
			// do a whole bunch of stuff here!
			console.log(msg);
			const msgJSON = JSON.parse(msg.content.toString());
			console.log(msgJSON);
			console.log(msgJSON.deployId);
			console.log(msgJSON.template);


			// clone repo into local fs
			exec(`cd tmp;git clone ${msgJSON.template}.git ${msgJSON.deployId}`)
				.then( (result) => {
					logResult(result);
					ch.sendToQueue('deployMessages', bufferKey(result.stdout, msgJSON.deployId));
					return exec(`cd tmp;cd ${msgJSON.deployId};ls`);
				})
				.then( (result) => {
					logResult(result);
					ch.sendToQueue('deployMessages', bufferKey('Verify git clone', msgJSON.deployId));
					ch.sendToQueue('deployMessages', bufferKey(result.stdout, msgJSON.deployId));
					// grab the deploy script from the repo
					console.log(`going to look in the directory /app/tmp/${msgJSON.deployId}/orgInit.sh`);
					if (fs.existsSync(`/app/tmp/${msgJSON.deployId}/orgInit.sh`)){
						let parsedLines = [];
						let noFail = true;
						const rl = readline.createInterface({
							input: fs.createReadStream(`/app/tmp/${msgJSON.deployId}/orgInit.sh`),
							terminal: false
						}).on('line', (line) => {
							console.log(`Line: ${line}`);
							// ch.sendToQueue('deployMessages', bufferKey(line, msgJSON.deployId));

							// exclusions
							if (line.includes(';')) {
								ch.sendToQueue('deployMessages', bufferKey(`Commands with semicolons (;) cannot be executed.  Put each command on a separate line.  Your command: ${line}`, msgJSON.deployId));
								noFail = false;
								rl.close();
								ch.ack(msg);
							} else if (!line){
								console.log('empty line');
							} else if (!line.startsWith('sfdx') && !line.startsWith('#')){
								ch.sendToQueue('deployMessages', bufferKey(`Commands must start with sfdx or be comments (security, yo!).  Your command: ${line}`, msgJSON.deployId));
								noFail = false;
								rl.close();
								ch.ack(msg);
							} else {
								console.log('line pushed');
								parsedLines.push(`cd tmp;cd ${msgJSON.deployId};${line}`);
							}
						}).on('close', () => {
							// you have all the parsed lines
							console.log('in the close event');
							console.log(parsedLines);
							if (noFail){
								console.log('no fail is true');
								async function executeLines(lines) {
									for(let line of lines) {
										let localLine = line;
										console.log(localLine);
										// corrections and improvements for individual commands
										if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -p')) {
											localLine = localLine + ' -p';
											console.log(localLine);
										}
										try {
											var lineResult = await exec(localLine);
											console.log(lineResult.stderr);
											if (lineResult.stdout){
												console.log(lineResult.stdout);
												ch.sendToQueue('deployMessages', bufferKey(lineResult.stdout, msgJSON.deployId));
											}
											if (lineResult.stderr){
												console.log(lineResult.stderr);
												ch.sendToQueue('deployMessages', bufferKey(lineResult.stderr, msgJSON.deployId));
											}
										} catch (err) {
											console.error('Error: ', err);
											ch.sendToQueue('deployMessages', bufferKey(`Error: ${err}`, msgJSON.deployId));
										}
									}
								};
								executeLines(parsedLines)
								.then( () => {
									ch.sendToQueue('deployMessages', bufferKey('ALLDONE', msgJSON.deployId));
									ch.ack(msg);
								});
							}
						}); // end of on.close event
					} else {
						ch.sendToQueue('deployMessages', bufferKey('There is no orgInit.sh', msgJSON.deployId));
					}
				})
				.catch( err => {
					console.error('Error: ', err);
					ch.ack(msg);
				});

		}, { noAck: false });
	});
	return ok;

});









