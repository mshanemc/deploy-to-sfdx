// /ht: https://gist.github.com/jeffdonthemic/de5432f3e308882484f2acea68ebfabd
import { processWrapper } from '../lib/processWrapper';
import logger from 'heroku-logger';

import jsforce from 'jsforce';
import jwt from 'salesforce-jwt-bearer-token-flow';

import util from 'util';

const getToken = util.promisify(jwt.getToken);

// create the connection to the org
const jwtConn = async () => {
    const response = await getToken({
        iss: processWrapper.PD_CONSUMERKEY,
        sub: processWrapper.PD_USERNAME,
        aud: 'https://login.salesforce.com',
        privateKey: processWrapper.PD_KEY
    }).catch((e) => logger.error('tokenResponse', e));
    logger.debug('tokenResponse', response);

    const conn = new jsforce.Connection({
        accessToken: response.access_token,
        instanceUrl: response.instance_url
    });

    console.log(`Successfully connected to Org`, conn.version);
    return conn;
};

export { jwtConn };
