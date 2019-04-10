import * as logger from 'heroku-logger';
import * as util from 'util';
import { exec } from 'child_process';

import { getDeleteQueueSize, getDeleteRequest } from '../lib/redisNormal';
import { auth, getKeypath } from './../lib/hubAuth';

const execProm = util.promisify(exec);

(async () => {

    // auth to the hub
    const keypath = getKeypath();
    await auth();
    
    // keep deleting until the queue is empty
    while (await getDeleteQueueSize() > 0) { 

        // pull from the delete Request Queue
        const deleteReq = await getDeleteRequest();
        logger.debug(`deleting org with username ${deleteReq.username}`);

        // auth to the org
        await execProm(
            `sfdx force:auth:jwt:grant --json --clientid ${
              process.env.CONSUMERKEY
            } --username ${
                deleteReq.username
            } --jwtkeyfile ${keypath} --instanceurl https://test.salesforce.com -s`
        );

        //delete it
        await execProm(`sfdx force:org:delete -p -u ${deleteReq.username}`);
    }
})();