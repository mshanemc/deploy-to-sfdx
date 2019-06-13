import * as logger from 'heroku-logger';
import { retry } from '@lifeomic/attempt';

import { execProm } from '../lib/execProm';
import { getDeleteQueueSize, getDeleteRequest, getAppNamesFromHerokuCDSs } from '../lib/redisNormal';
import { auth, getKeypath } from './../lib/hubAuth';
import { herokuDelete } from './../lib/herokuDelete';

const retryOptions = { maxAttempts: 60, delay: 5000 };

(async () => {
    const delQueueInitialSize = await getDeleteQueueSize();
    
    if (delQueueInitialSize > 0) {
        logger.debug(`deleting ${delQueueInitialSize} orgs`);
        // auth to the hub
        const keypath = await getKeypath();
        await auth();
        
        // keep deleting until the queue is empty
        try {
            while (await getDeleteQueueSize() > 0) { 
                const deleteReq = await getDeleteRequest();

                try {
                    // pull from the delete Request Queue
                    logger.debug(`deleting org with username ${deleteReq.username}`);
        
                    await retry( 
                        async context => execProm(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${ deleteReq.username } --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`), 
                        retryOptions
                      );
        
                    //delete it
                    await execProm(`sfdx force:org:delete -p -u ${deleteReq.username}`);                                    
                } catch (e) {
                    logger.error(e);
                    logger.warn(`unable to delete org with username: ${deleteReq.username}`);
                }

                // go through the herokuCDS for the username
                for (const appName of await getAppNamesFromHerokuCDSs(deleteReq.username, false)) {
                    try {
                        await herokuDelete(appName);
                    } catch (e) {
                        logger.error(e);
                    }
                    logger.debug(`deleted heroku app with name ${appName}`);
                }
                
            }
        } catch (e) {
            logger.error(e);
        }
        

    } else {
        logger.debug('no orgs to delete');
    }
    process.exit(0);

})();