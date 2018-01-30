// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/DF17integrationWorkshops

const ua = require('universal-analytics');
const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser');
const logger = require('heroku-logger');
// const cookieParser = require('cookie-parser');
const msgBuilder = require('./lib/deployMsgBuilder');

const ex = 'deployMsg';

// const http = require('http');

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

  // allow repos to require the email parameter
  if (req.query.email === 'required'){
    return res.render('pages/userinfo', {
      template: req.query.template
    });
  }

  // no template?  does not compute!
  if (!req.query.template) {
    return res.render('pages/error', {
      customError: 'There should be a github repo in that url.  Example: /launch?template=https://github.com/you/repo'
    });
  }

  const message = msgBuilder(req.query);
  // analytics
  const visitor = ua(process.env.UA_ID);
  visitor.pageview('/launch').send();
  visitor.event('Repo', req.query.template).send();

  mq.then( (mqConn) => {
    let ok = mqConn.createChannel();
    ok = ok.then((ch) => {
      ch.assertQueue('deploys', { durable: true });
      ch.sendToQueue('deploys', new Buffer(JSON.stringify(message)));
    });
    return ok;
  }).then( () => {
    // return the deployId page
    return res.redirect(`/deploying/${message.deployId}`);
  }, (mqerr) => {
    logger.error(mqerr);
    return res.redirect('pages/error', {
      customError : mqerr
    });
  });
});

app.get('/userinfo', (req, res) => {
  res.render('pages/userinfo', {
    template: req.query.template
  });
});

app.get('/deploying/:deployId', (req, res) => {
  // show the page with .io to subscribe to a topic
  res.render('pages/messages', { deployId: req.params.deployId });
});

app.ws('/deploying/:deployId', (ws, req) => {
    logger.debug('client connected!');
    // ws.send('welcome to the socket!');
    ws.on('close', () => logger.info('Client disconnected'));
  }
);

const port = process.env.PORT || 8443;


app.listen(port, () => {
  logger.info(`Example app listening on port ${port}!`);
});

mq.then( (mqConn) => {
  logger.debug('mq connection good');

	let ok = mqConn.createChannel();
	ok = ok.then((ch) => {
    logger.debug('channel created');
    ch.assertExchange(ex, 'fanout', { durable: false })
    .then( (exch) => {
      logger.debug('exchange asserted');
      return ch.assertQueue('', { exclusive: true });
    }).then( (q) => {
      logger.debug('queue asserted');
      ch.bindQueue(q.queue, ex, '');
      ch.consume(q.queue, (msg) => {
        logger.debug('heard a message from the worker');
        const parsedMsg = JSON.parse(msg.content.toString());
        logger.debug(parsedMsg);
        wsInstance.getWss().clients.forEach((client) => {
          if (client.upgradeReq.url.includes(parsedMsg.deployId)) {
            client.send(msg.content.toString());
            // close connection when ALLDONE
            if (parsedMsg.content === 'ALLDONE') {
              client.close();
            }
          }
        });

        ch.ack(msg);
      }, { noAck: false });
    });
  });
  return ok;
})
.catch( (mqerr) => {
  logger.error(`MQ error ${mqerr}`);
});

