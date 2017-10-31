const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');

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
			const msgJSON = JSON.parse(msg);
			console.log(msgJSON);
			console.log(msgJSON.deployId);
			console.log(msgJSON.template);

			// grab the deploy script from the repo

			// split deploy script into lines

			// iterate the lines

			// validate the line for sfdx and no ;

			// execute the line

			ch.ack(msg);
			ch.sendToQueue('deployMessages', new Buffer(JSON.stringify('Test Message for round trip to client')));

		}, { noAck: false });
	});
	return ok;

});




