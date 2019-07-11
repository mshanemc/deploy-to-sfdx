import * as logger from 'heroku-logger';
import * as express from 'express';
import * as ua from 'universal-analytics';
import * as path from 'path';
import * as favicon from 'serve-favicon';

import { putDeployRequest, getKeys, cdsDelete, cdsRetrieve, cdsPublish } from './lib/redisNormal';
import * as msgBuilder from './lib/deployMsgBuilder';
import * as utilities from './lib/utilities';
import { emitLead } from './lib/trialLeadCreate';

import { deployRequest } from './lib/types';
import { CDS } from './lib/CDS';

const app = express();

const port = process.env.PORT || 8443;

app.listen(port, () => {
    logger.info(`Example app listening on port ${port}!`);
});

app.use(favicon(path.join(__dirname, 'assets/favicons', 'favicon.ico')));
app.use(express.static('built/assets'));
app.use(express.json());

app.post(
    '/trial',
    wrapAsync(async (req, res, next) => {
        const message = await commonDeploy(req, '/trial');
        logger.debug('trial request', message);
        emitLead(req.body);
        res.redirect(`/deploying/trial/${message.deployId.trim()}`);
    })
);

app.post(
    '/delete',
    wrapAsync(async (req, res, next) => {
        await cdsDelete(req.body.deployId);
        res.send({ redirectTo: '/deleteConfirm' });
    })
);

app.get(
    '/launch',
    wrapAsync(async (req, res, next) => {
        // allow repos to require the email parameter
        if (req.query.email === 'required') {
            return res.redirect(`/userinfo?template=${req.query.template}`);
        }

        const message = await commonDeploy(req, '/launch');
        return res.redirect(`/deploying/deployer/${message.deployId.trim()}`);
    })
);

app.get(['/', '/error', '/deploying/:format/:deployId', '/userinfo', '/testform', '/deleteConfirm'], (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../built/assets') });
});

app.get(
    '/pools',
    wrapAsync(async (req, res, next) => {
        const keys = await getKeys();
        res.send(keys);
    })
);

app.get(
    '/results/:deployId',
    wrapAsync(async (req, res, next) => {
        const results = await cdsRetrieve(req.params.deployId);
        res.send(results);
    })
);

app.get('*', (req, res, next) => {
    setImmediate(() => {
        next(new Error(`Route not found: ${req.url} on action ${req.method}`));
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

function wrapAsync(fn) {
    return function(req, res, next) {
        // Make sure to `.catch()` any errors and pass them along to the `next()`
        // middleware in the chain, in this case the error handler.
        fn(req, res, next).catch(next);
    };
}

const commonDeploy = async (req, url: string) => {
    const message: deployRequest = msgBuilder(req);

    if (message.visitor) {
        message.visitor.pageview(url).send();
        message.visitor.event('Repo', message.template).send();
    }

    utilities.runHerokuBuilder();
    await putDeployRequest(message);
    await cdsPublish(
        new CDS({
            deployId: message.deployId
        })
    );
    return message;
};

process.on('unhandledRejection', e => {
    logger.error('this reached the unhandledRejection handler somehow:', e);
});
