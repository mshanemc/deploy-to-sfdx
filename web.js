// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/DF17integrationWorkshops

const express = require('express');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const https = require('https');
const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');
const events = require('events');

const serverEmitter = new events.EventEmitter();

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// const router = express.Router();

app.use('/scripts', express.static(`${__dirname}/scripts`));
app.use('/dist', express.static(`${__dirname}/dist`));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.set('view engine', 'ejs');
// app.use(cookieParser());

require('./lib/app-express')(app);
// require('./lib/app-router')(router);

// app.use('/api', router);

const port = process.env.PORT || 8443;

// subscribe to the q for deploy messages and broadcast them to everyone

io.sockets.on('connection', function (socket) {
  serverEmitter.on('deployMessage', function (msg) {
    socket.emit(msg);
  });
});

mq.then( (mqConn) => {
	let ok = mqConn.createChannel();
	ok = ok.then((ch) => {
		ch.assertQueue('deployMessages', { durable: true });
		ch.consume('deployMessages', (msg) => {
      // do a whole bunch of stuff here!
      console.log('heard a message from the worker');
      console.log(msg);
      serverEmitter.emit('deployMessage', 'I\'m a Test deploy message');

			ch.ack(msg);
		}, { noAck: false });
	});
	return ok;

});


// if local, use 8443 and certificate
if (process.env.NODE_ENV === 'dev') {

  const passPhrase = process.env.PASS_PHRASE;
  const certPem = process.env.CERT_PEM.replace(/\\n/g, '\n');
  const keyPem = process.env.KEY_PEM.replace(/\\n/g, '\n');

  const sslOptions = {
    key: keyPem,
    cert: certPem,
    passphrase: passPhrase
  };

  const httpsServer = https.createServer(sslOptions, app);

  httpsServer.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });

} else {

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
  });

  server.listen(80);


}

