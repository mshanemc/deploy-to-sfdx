// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/cg7demorepo

console.log('I am a worker and I am up!');

const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');
const exec = require('child-process-promise').exec;
const readline = require('readline');
const fs = require('fs');

// do an exec to get auth'd to our standard sfdx hub

function bufferKey(content, deployId) {
	const message = {
		deployId,
		content
	};
	return new Buffer(JSON.stringify(message));
}

// listen for messages
mq.then( (mqConn) => {
	let ok = mqConn.createChannel();
	ok = ok.then((ch) => {
		ch.assertQueue('deploys', { durable: true });
		ch.assertQueue('deployMessages',{ durable: true });
		ch.prefetch(1);
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
					console.log(result.stdout);
					console.log(result.stderr);
					ch.sendToQueue('deployMessages', bufferKey(result.stdout));
					return exec(`cd tmp;cd ${msgJSON.deployId};ls`);
				})
				.then( (result) => {
					console.log(result.stdout);
					console.log(result.stderr);
					ch.sendToQueue('deployMessages', bufferKey('Verify git clone'));
					ch.sendToQueue('deployMessages', bufferKey(result.stdout));
					// grab the deploy script from the repo
					console.log(`going to look in the directory /app/tmp/${msgJSON.deployId}/orgInit.sh`);
					if (fs.existsSync(`/app/tmp/${msgJSON.deployId}/orgInit.sh`)){
						readline.createInterface({
							input: fs.createReadStream(`/app/tmp/${msgJSON.deployId}/orgInit.sh`),
							terminal: false
						}).on('line', (line) => {
							console.log(`Line: ${line}`);
							ch.sendToQueue('deployMessages', bufferKey(line));
						}).on('close', () => ch.ack(msg)); // keep moving this toward the end!
					} else {
						ch.sendToQueue('deployMessages', bufferKey('There is no orgInit.sh'));
						ch.ack(msg);
					}
				})
				.catch( err => console.error('Error: ', err));


			// split deploy script into lines

			// iterate the lines

			// validate the line for sfdx and no ;

			// execute the line


			// ch.sendToQueue('deployMessages', new Buffer(JSON.stringify('DONE!')));

		}, { noAck: false });
	});
	return ok;

});









