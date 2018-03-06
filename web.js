// https://hosted-scratch-qa.herokuapp.com/launch?template=https://github.com/mshanemc/DF17integrationWorkshops

const ua = require('universal-analytics');
const express = require('express');
const expressWs = require('express-ws');
const bodyParser = require('body-parser');
const logger = require('heroku-logger');
// const cookieParser = require('cookie-parser');
const msgBuilder = require('./lib/deployMsgBuilder');

const ex = 'deployMsg';

const redis = require('./lib/redisNormal');
const redisSub = require('./lib/redisSubscribe');

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

app.post('/trial', (req, res) => {
  const message = msgBuilder(req.query);
  console.log(message);

  // assign the email from the post field because it wasn't in the query string
  message.email = req.body.UserEmail;
  // console.log(req.body.UserFirstName);
  // console.log(req.body.UserLastName);

  const visitor = ua(process.env.UA_ID);
  visitor.pageview('/trial').send();
  visitor.event('Repo', req.query.template).send();

  redis.rpush('deploys', JSON.stringify(message))
    .then(() => res.redirect(`/deploying/trial/${message.deployId}`))
    .catch((redisErr) => {
      logger.error(redisErr);
      return res.redirect('pages/error', {
        customError: redisErr
      });
    });

});

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

  if (req.query.template.includes('?')){
    return res.render('pages/error', {
      customError: `That template has a ? in it, making the url impossible to parse: ${req.query.template}`
    });
  }

  const message = msgBuilder(req.query);
  // analytics
  const visitor = ua(process.env.UA_ID);
  visitor.pageview('/launch').send();
  visitor.event('Repo', req.query.template).send();


  redis.rpush(message.pool ? 'poolDeploys' : 'deploys', JSON.stringify(message))
    .then((rpushResult) => {
      console.log(rpushResult);
      if (message.pool) {
        logger.debug('putting in pool deploy queue');
        return res.send('pool initiated');
      } else {
        logger.debug('putting in reqular deploy queue');
        return res.redirect(`/deploying/deployer/${message.deployId}`);
      }
    })
    .catch((redisErr) => {
      logger.error(redisErr);
      return res.render('pages/error', {
        customError: redisErr
      });
    });

});

app.get('/userinfo', (req, res) => {
  res.render('pages/userinfo', {
    template: req.query.template
  });
});

app.get('/deploying/:format/:deployId', (req, res) => {
  res.render('pages/messages', {
    deployId: req.params.deployId,
    format: req.params.format
  });
});

app.get('/testform', (req, res) => {
  res.render('pages/testForm');
});

app.ws('/deploying/:format/:deployId', (ws, req) => {
    logger.debug('client connected!');
    // ws.send('welcome to the socket!');
    ws.on('close', () => logger.info('Client disconnected'));
  }
);

const port = process.env.PORT || 8443;

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}!`);
});

// subscribe to deploy events to share them with the web clients
redisSub.subscribe(ex)
  .then((result) => {
    logger.debug(`subscribed to Redis channel ${ex}`);
    console.log(result);
  });

redisSub.on('message', (channel, message) => {
  logger.debug('heard a message from the worker:');
  const msgJSON = JSON.parse(message);
  console.log(msgJSON);
  wsInstance.getWss().clients.forEach((client) => {
    if (client.upgradeReq.url.includes(msgJSON.deployId)) {
      client.send(JSON.stringify(msgJSON));
      // close connection when ALLDONE
      if (msgJSON.content === 'ALLDONE') {
        client.close();
      }
    }
  });
});
