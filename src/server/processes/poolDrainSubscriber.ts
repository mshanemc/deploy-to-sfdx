import { jwtConn } from '../lib/jwtConn';
import { getPoolName } from '../lib/namedUtilities';
import { getAllPooledOrgs, deleteOrg, redis } from '../lib/redisNormal';
import logger from 'heroku-logger';

const handleEvent = async message => {
    logger.debug('heard platform event', message);
    const poolname = getPoolName({
        lifeHours: 0,
        quantity: 0,
        repos: [
            {
                source: 'github',
                username: message.payload.Github_Username__c,
                repo: message.payload.Github_Repo__c,
                branch: message.payload.Github_Branch__c || undefined
            }
        ]
    });

    // get orgs from pool
    const allOrgs = await getAllPooledOrgs(poolname);
    // delete the actual pool
    await redis.del(poolname);
    // pass orgs to delete
    await Promise.all(allOrgs.map(cds => deleteOrg(cds.mainUser.username)));
};

(async () => {
    // auth to the org
    // subscribe to the stream
    let conn = await jwtConn();

    conn.streaming.topic('/event/Pool_Drain__e').subscribe(handleEvent);

    logger.info('subscription is done');
})();
