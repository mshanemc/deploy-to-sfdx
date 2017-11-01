// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/cg7demorepo
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
	console.log(result.stdout);
	console.log(result.stderr);
	return exec('sfdx force:org:display -u hub');
})
.then( (result) => {
	console.log(result.stdout);
	console.log(result.stderr);
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
					console.log(result.stdout);
					console.log(result.stderr);
					ch.sendToQueue('deployMessages', bufferKey(result.stdout, msgJSON.deployId));
					return exec(`cd tmp;cd ${msgJSON.deployId};ls`);
				})
				.then( (result) => {
					console.log(result.stdout);
					console.log(result.stderr);
					ch.sendToQueue('deployMessages', bufferKey('Verify git clone', msgJSON.deployId));
					ch.sendToQueue('deployMessages', bufferKey(result.stdout, msgJSON.deployId));
					// grab the deploy script from the repo
					console.log(`going to look in the directory /app/tmp/${msgJSON.deployId}/orgInit.sh`);
					if (fs.existsSync(`/app/tmp/${msgJSON.deployId}/orgInit.sh`)){
						const rl = readline.createInterface({
							input: fs.createReadStream(`/app/tmp/${msgJSON.deployId}/orgInit.sh`),
							terminal: false
						}).on('line', (line) => {
							// rl.pause();
							console.log(`Line: ${line}`);
							ch.sendToQueue('deployMessages', bufferKey(line, msgJSON.deployId));

						}).on('close', () => ch.ack(msg)); // keep moving this toward the end!
					} else {
						ch.sendToQueue('deployMessages', bufferKey('There is no orgInit.sh', msgJSON.deployId));
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









