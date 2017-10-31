// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/DF17integrationWorkshops

const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');

const https = require('https');

const mq = require('amqplib').connect(process.env.CLOUDAMQP_URL || 'amqp://localhost');

const app = express();
const wsInstance = expressWs(app);

// const router = express.Router();

app.use('/scripts', express.static(`${__dirname}/scripts`));
app.use('/dist', express.static(`${__dirname}/dist`));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
app.set('view engine', 'ejs');
// app.use(cookieParser());
app.get('/launch', (req, res) => {
  // what are we deploying?
  const repo = req.query.template.replace('https://github.com/', '').replace('/', '-');
  // generate unique id for this deployment
  const deployId = encodeURIComponent(`${repo}-${new Date().valueOf()}`);
  console.log(`creating new deployId of ${deployId}`);

  // drop a message
  const message = {
    deployId,
    template : req.query.template
  };

  mq.then( (mqConn) => {
    let ok = mqConn.createChannel();
    ok = ok.then((ch) => {
      ch.assertQueue('deploys', { durable: true });
      ch.sendToQueue('deploys', new Buffer(JSON.stringify(message)));
    });
    return ok;
  }).then( () => {
    // return the deployId page
    return res.redirect(`/deploying/${deployId}`);
  }, (mqerr) => {
    console.log(mqerr);
    return res.redirect('/error', {
      customError : mqerr
    });
  });
});

app.get('/deploying/:deployId', (req, res) =>
  // show the page with .io to subscribe to a topic
  res.render('pages/messages', { deployId: req.params.deployId })
);

app.ws('/deploying/:deployId', (ws, req) => {
    console.log('client connected!');
    ws.send('welcome to the socket!');
    ws.on('close', () => console.log('Client disconnected'));
  }
);


// require('./lib/app-router')(router);

// app.use('/api', router);

const port = process.env.PORT || 8443;

// subscribe to the q for deploy messages and broadcast them to everyone

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

}

mq.then( (mqConn) => {
	let ok = mqConn.createChannel();
	ok = ok.then((ch) => {
		ch.assertQueue('deployMessages', { durable: true });
		ch.consume('deployMessages', (msg) => {
      // do a whole bunch of stuff here!
      console.log('heard a message from the worker');
      console.log(msg.content.toString());
      wsInstance.getWss().clients.forEach((client) => {
        client.send(msg.content.toString());
      });

			ch.ack(msg);
		}, { noAck: false });
	});
	return ok;

});

