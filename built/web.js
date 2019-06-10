"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const express = require("express");
const ua = require("universal-analytics");
const bodyParser = require("body-parser");
const WebSocket = require("ws");
const path = require("path");
const favicon = require("serve-favicon");
const redisNormal_1 = require("./lib/redisNormal");
const redisSub = require("./lib/redisSubscribe");
const msgBuilder = require("./lib/deployMsgBuilder");
const utilities = require("./lib/utilities");
const trialLeadCreate_1 = require("./lib/trialLeadCreate");
const app = express();
const port = process.env.PORT || 8443;
const server = app.listen(port, () => {
    logger.info(`Example app listening on port ${port}!`);
});
const wss = new WebSocket.Server({ server, clientTracking: true });
app.use(favicon(path.join(__dirname, 'assets/favicons', 'favicon.ico')));
app.use(express.static('built/assets'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.post('/trial', wrapAsync(async (req, res, next) => {
    const message = msgBuilder(req);
    logger.debug('trial request', message);
    trialLeadCreate_1.emitLead(req.body);
    if (message.visitor) {
        message.visitor.pageview('/trial').send();
        message.visitor.event('Repo', message.template).send();
    }
    utilities.runHerokuBuilder();
    await redisNormal_1.putDeployRequest(message);
    res.redirect(`/deploying/trial/${message.deployId.trim()}`);
}));
app.post('/delete', wrapAsync(async (req, res, next) => {
    await redisNormal_1.deleteOrg(req.body.username);
    res.status(302).send('/deleteConfirm');
}));
app.get('/deleteConfirm', (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});
app.get('/launch', wrapAsync(async (req, res, next) => {
    if (req.query.email === 'required') {
        return res.redirect(`/userinfo?template=${req.query.template}`);
    }
    const message = msgBuilder(req);
    if (message.visitor) {
        message.visitor.pageview('/launch').send();
        message.visitor.event('Repo', message.template).send();
    }
    utilities.runHerokuBuilder();
    await redisNormal_1.putDeployRequest(message);
    return res.redirect(`/deploying/deployer/${message.deployId.trim()}`);
}));
app.get('/deploying/:format/:deployId', (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});
app.get('/userinfo', (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});
app.get('/pools', wrapAsync(async (req, res, next) => {
    const keys = await redisNormal_1.getKeys();
    res.send(keys);
}));
app.get('/testform', (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});
app.get('/', (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});
app.get('/error', (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});
app.get('*', (req, res, next) => {
    setImmediate(() => {
        next(new Error(`Route not found: ${req.url}`));
    });
});
app.use((error, req, res, next) => {
    if (process.env.UA_ID) {
        const visitor = ua(process.env.UA_ID);
        visitor.event('Error', req.query.template).send();
    }
    logger.error(`request failed: ${req.url}`);
    logger.error(error);
    return res.redirect(`/error?msg=${error}`);
});
wss.on('connection', (ws, req) => {
    logger.debug(`connection on url ${req.url}`);
    ws.url = req.url;
});
redisSub.subscribe(redisNormal_1.cdsExchange)
    .then(() => logger.info(`subscribed to Redis channel ${redisNormal_1.cdsExchange}`))
    .catch(e => logger.error('unable to subscribe to cdsExchange', e));
redisSub.on('message', (channel, message) => {
    const msgJSON = JSON.parse(message);
    wss.clients.forEach((client) => {
        if (client.url.includes(msgJSON.deployId.trim()) && client.readyState === client.OPEN) {
            client.send(JSON.stringify(msgJSON));
            if (msgJSON.complete) {
                client.close();
            }
        }
    });
});
function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}
process.on('unhandledRejection', e => {
    logger.error('this reached the unhandledRejection handler somehow:', e);
});
