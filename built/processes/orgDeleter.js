"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const attempt_1 = require("@lifeomic/attempt");
const execProm_1 = require("../lib/execProm");
const redisNormal_1 = require("../lib/redisNormal");
const hubAuth_1 = require("./../lib/hubAuth");
const herokuDelete_1 = require("./../lib/herokuDelete");
const retryOptions = { maxAttempts: 60, delay: 5000 };
(async () => {
    const delQueueInitialSize = await redisNormal_1.getDeleteQueueSize();
    if (delQueueInitialSize > 0) {
        logger.debug(`deleting ${delQueueInitialSize} orgs`);
        const keypath = await hubAuth_1.getKeypath();
        await hubAuth_1.auth();
        try {
            while (await redisNormal_1.getDeleteQueueSize() > 0) {
                const deleteReq = await redisNormal_1.getDeleteRequest();
                try {
                    logger.debug(`deleting org with username ${deleteReq.username}`);
                    await attempt_1.retry(async (context) => execProm_1.execProm(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${deleteReq.username} --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`), retryOptions);
                    await execProm_1.execProm(`sfdx force:org:delete -p -u ${deleteReq.username}`);
                }
                catch (e) {
                    logger.error(e);
                    logger.warn(`unable to delete org with username: ${deleteReq.username}`);
                }
                for (const appName of await redisNormal_1.getAppNamesFromHerokuCDSs(deleteReq.username)) {
                    try {
                        await herokuDelete_1.herokuDelete(appName);
                    }
                    catch (e) {
                        logger.error(e);
                    }
                    logger.debug(`deleted heroku app with name ${appName}`);
                }
            }
        }
        catch (e) {
            logger.error(e);
        }
    }
    else {
        logger.debug('no orgs to delete');
    }
    process.exit(0);
})();
