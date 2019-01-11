"use strict";
const fs = require("fs");
const logger = require("heroku-logger");
const util = require("util");
const exec = util.promisify(require('child_process').exec);
const hubAuth = async function () {
    let keypath;
    if (process.env.LOCAL_ONLY_KEY_PATH) {
        logger.debug('hubAuth...loading local key');
        keypath = process.env.LOCAL_ONLY_KEY_PATH;
    }
    else {
        logger.debug('hubAuth...creating cloud key');
        fs.writeFileSync('/app/tmp/server.key', process.env.JWTKEY, 'utf8');
        keypath = '/app/tmp/server.key';
    }
    logger.debug('updating plugin');
    try {
        if (process.env.JWTKEY) {
            await exec('sfdx plugins:link node_modules/shane-sfdx-plugins');
        }
        if (process.env.SFDX_PRERELEASE) {
            await exec('sfdx plugins:install salesforcedx@pre-release');
        }
        if (process.env.HEROKU_API_KEY) {
            await exec('heroku update');
        }
        await exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${keypath} --setdefaultdevhubusername -a hub`);
    }
    catch (err) {
        logger.error('error in hubAuth', err);
        process.exit(1);
    }
    return keypath;
};
module.exports = hubAuth;
