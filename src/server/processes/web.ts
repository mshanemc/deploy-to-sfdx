import logger from 'heroku-logger';
import express from 'express';

import ua from 'universal-analytics';
import path from 'path';
import jsforce from 'jsforce';

import cors from 'cors';

import { putDeployRequest, getKeys, cdsDelete, cdsRetrieve, cdsPublish, putLead, getAllPooledOrgIDs } from '../lib/redisNormal';
import { deployMsgBuilder } from '../lib/deployMsgBuilder';
import { utilities } from '../lib/utilities';
import { getPoolKey } from '../lib/namedUtilities';
import { multiTemplateURLBuilder } from '../lib/multiTemplateURLBuilder';

import { processWrapper } from '../lib/processWrapper';

import { DeployRequest } from '../lib/types';
import { CDS } from '../lib/CDS';

const app: express.Application = express();

const port = processWrapper.PORT;

app.listen(port, () => {
    logger.info(`Example app listening on port ${port}!`);
});

// app.use(favicon(path.join(__dirname, 'assets/favicons', 'favicon.ico')));
app.use(express.static('dist'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

function wrapAsync(fn: any) {
    return function (req, res, next) {
        // Make sure to `.catch()` any errors and pass them along to the `next()`
        // middleware in the chain, in this case the error handler.
        fn(req, res, next).catch(next);
    };
}

const commonDeploy = async (req, url: string) => {
    const message: DeployRequest = deployMsgBuilder(req);

    if (message.visitor) {
        message.visitor.pageview(url).send();
        message.visitor.event('Repo', getPoolKey(message, '-')).send();
    }

    utilities.runHerokuBuilder();
    await Promise.all([
        putDeployRequest(message),
        cdsPublish(
            new CDS({
                deployId: message.deployId
            })
        )
    ]);

    return message;
};

app.post(
    '/trial',
    wrapAsync(async (req, res, next) => {
        const [message] = await Promise.all([commonDeploy(req, '/trial'), putLead(req.body)]);
        logger.debug('trial request', message);
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
            return res.redirect(multiTemplateURLBuilder(req.query.template, '/userinfo'));
        }

        const message = await commonDeploy(req, '/launch');
        return res.redirect(`/deploying/deployer/${message.deployId.trim()}`);
    })
);

app.get(['/', '/error', '/deploying/:format/:deployId', '/userinfo', '/byoo', '/testform', '/deleteConfirm'], (req, res, next) => {
    res.sendFile('index.html', { root: path.join(__dirname, '../../../dist') });
});

app.get(['/byoo'], (req, res, next) => {
    if (processWrapper.BYOO_CALLBACK_URI && processWrapper.BYOO_CONSUMERKEY && processWrapper.BYOO_SECRET) {
        res.sendFile('index.html', { root: path.join(__dirname, '../../../dist') });
    } else {
        setImmediate(() => {
            next(new Error('Connected app credentials not properly configured for Bring Your Own Org feature'));
        });
    }
});

app.get(
    '/pools',
    wrapAsync(async (req, res, next) => {
        const keys = await getKeys();
        res.send(keys);
    })
);

app.get(
    '/pools/:poolname',
    wrapAsync(async (req, res, next) => {
        const orgIDs = await getAllPooledOrgIDs(req.params.poolname);
        res.send(orgIDs);
    })
);

app.get(
    '/results/:deployId',
    wrapAsync(async (req, res, next) => {
        const results = await cdsRetrieve(req.params.deployId);
        res.send(results);
    })
);

app.get('/favicons/favicon.ico', (req, res, next) => {
    res.sendFile('favicon.ico', { root: path.join(__dirname, '../../../dist/resources/favicons') });
});

app.get('/service-worker.js', (req, res, next) => {
    res.sendStatus(200);
});

app.get(
    '/authUrl',
    wrapAsync(async (req, res, next) => {
        const byooOauth2 = new jsforce.OAuth2({
            redirectUri: processWrapper.BYOO_CALLBACK_URI ?? `http://localhost:${port}/token`,
            clientId: processWrapper.BYOO_CONSUMERKEY,
            clientSecret: processWrapper.BYOO_SECRET,
            loginUrl: req.query.base_url
        });
        // console.log('state will be', JSON.stringify(req.query));
        res.send(
            byooOauth2.getAuthorizationUrl({
                scope: 'api id web openid',
                state: JSON.stringify(req.query)
            })
        );
    })
);

app.get(
    '/token',
    wrapAsync(async (req, res, next) => {
        const state = JSON.parse(req.query.state);
        // console.log(`state`, state);
        const byooOauth2 = new jsforce.OAuth2({
            redirectUri: processWrapper.BYOO_CALLBACK_URI ?? `http://localhost:${port}/token`,
            clientId: processWrapper.BYOO_CONSUMERKEY,
            clientSecret: processWrapper.BYOO_SECRET,
            loginUrl: state.base_url
        });
        const conn = new jsforce.Connection({ oauth2: byooOauth2 });
        const userinfo = await conn.authorize(req.query.code);

        // put the request in the queue
        const message = await commonDeploy(
            {
                query: {
                    template: state.template
                },
                byoo: {
                    accessToken: conn.accessToken,
                    instanceUrl: conn.instanceUrl,
                    username: userinfo.id,
                    orgId: userinfo.organizationId
                }
            },
            'byoo'
        );
        return res.redirect(`/deploying/deployer/${message.deployId.trim()}`);
    })
);

app.get('*', (req, res, next) => {
    setImmediate(() => {
        next(new Error(`Route not found: ${req.url} on action ${req.method}`));
    });
});

app.use((error, req, res, next) => {
    if (processWrapper.UA_ID) {
        const visitor = ua(processWrapper.UA_ID);
        // TODO handle array of templates
        visitor.event('Error', req.query.template).send();
    }
    logger.error(`request failed: ${req.url}`);
    logger.error(error);
    return res.redirect(`/error?msg=${error}`);
});

// process.on('unhandledRejection', e => {
//     logger.error('this reached the unhandledRejection handler somehow:', e);
// });
