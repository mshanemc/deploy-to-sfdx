/* eslint-disable no-process-exit */
/* eslint-disable no-await-in-loop */
import logger from 'heroku-logger';

import { getLead, getLeadQueueSize, putFailedLead } from '../lib/redisNormal';

import { leadCreate } from '../lib/leadSupport';

(async () => {
    logger.debug('Lead queue consumer is up');
    while ((await getLeadQueueSize()) > 0) {
        const lead = await getLead();
        // logger.debug('lead is ', lead);
        try {
            await leadCreate(lead);
        } catch (e) {
            // logger.error('error in trialLeadCreate', e);
            await putFailedLead(lead);
        }
    }
    process.exit(0);
})();
