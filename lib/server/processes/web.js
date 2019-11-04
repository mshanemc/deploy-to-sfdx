"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const express_1 = __importDefault(require("express"));
const universal_analytics_1 = __importDefault(require("universal-analytics"));
const path_1 = __importDefault(require("path"));
const redisNormal_1 = require("../lib/redisNormal");
const deployMsgBuilder_1 = require("../lib/deployMsgBuilder");
const utilities_1 = require("../lib/utilities");
const trialLeadCreate_1 = require("../lib/trialLeadCreate");
const CDS_1 = require("../lib/CDS");
const app = express_1.default();
const port = process.env.PORT || 8443;
app.listen(port, () => {
    heroku_logger_1.default.info(`Example app listening on port ${port}!`);
});
app.use(express_1.default.static('dist'));
app.use(express_1.default.json());
app.post('/trial', wrapAsync(async (req, res, next) => {
    const message = await commonDeploy(req, '/trial');
    heroku_logger_1.default.debug('trial request', message);
    trialLeadCreate_1.emitLead(req.body);
    res.redirect(`/deploying/trial/${message.deployId.trim()}`);
}));
app.post('/delete', wrapAsync(async (req, res, next) => {
    await redisNormal_1.cdsDelete(req.body.deployId);
    res.send({ redirectTo: '/deleteConfirm' });
}));
app.get('/launch', wrapAsync(async (req, res, next) => {
    if (req.query.email === 'required') {
        return res.redirect(`/userinfo?template=${req.query.template}`);
    }
    const message = await commonDeploy(req, '/launch');
    return res.redirect(`/deploying/deployer/${message.deployId.trim()}`);
}));
app.get(['/', '/error', '/deploying/:format/:deployId', '/userinfo', '/testform', '/deleteConfirm'], (req, res, next) => {
    res.sendFile('index.html', { root: path_1.default.join(__dirname, '../../../dist') });
});
app.get('/pools', wrapAsync(async (req, res, next) => {
    const keys = await redisNormal_1.getKeys();
    res.send(keys);
}));
app.get('/results/:deployId', wrapAsync(async (req, res, next) => {
    const results = await redisNormal_1.cdsRetrieve(req.params.deployId);
    res.send(results);
}));
app.get('/favicons/favicon.ico', (req, res, next) => {
    res.sendFile('favicon.ico', { root: path_1.default.join(__dirname, '../../../dist/resources/favicons') });
});
app.get('/service-worker.js', (req, res, next) => {
    res.sendStatus(200);
});
app.get('*', (req, res, next) => {
    setImmediate(() => {
        next(new Error(`Route not found: ${req.url} on action ${req.method}`));
    });
});
app.use((error, req, res, next) => {
    if (process.env.UA_ID) {
        const visitor = universal_analytics_1.default(process.env.UA_ID);
        visitor.event('Error', req.query.template).send();
    }
    heroku_logger_1.default.error(`request failed: ${req.url}`);
    heroku_logger_1.default.error(error);
    return res.redirect(`/error?msg=${error}`);
});
function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}
const commonDeploy = async (req, url) => {
    const message = deployMsgBuilder_1.deployMsgBuilder(req);
    if (message.visitor) {
        message.visitor.pageview(url).send();
        if (typeof message.template === 'string') {
            message.visitor.event('Repo', message.template).send();
        }
    }
    utilities_1.utilities.runHerokuBuilder();
    await redisNormal_1.putDeployRequest(message);
    await redisNormal_1.cdsPublish(new CDS_1.CDS({
        deployId: message.deployId
    }));
    return message;
};
