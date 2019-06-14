import * as moment from 'moment';
import * as logger from 'heroku-logger';

import { redis, orgDeleteExchange, getHerokuCDSs, getAppNamesFromHerokuCDSs } from './redisNormal';
import { poolConfig, clientDataStructure } from './types';
import * as utilities from './utilities';
import { herokuDelete } from './herokuDelete';
import { execProm } from '../lib/execProm';

const skimmer = async () => {
	const pools = await utilities.getPoolConfig();
	const promises = [];

	pools.forEach(pool => {
		promises.push(checkExpiration(pool));
	});

	const results = await Promise.all(promises);
	results.forEach(result => logger.debug(result));
};

const checkExpiration = async (pool: poolConfig): Promise<string> => {
	const poolname = `${pool.user}.${pool.repo}`;
	const currentPoolSize = await redis.llen(poolname); // how many orgs are there?

	if (currentPoolSize === 0) {
		return `pool ${poolname} is empty`;
	}

  const allMessages = await redis.lrange(poolname, 0, -1); // we'll take them all
  const allOrgs:clientDataStructure[] = allMessages.map( msg => JSON.parse(msg));

	const goodOrgs = allOrgs
		.filter(org => moment().diff(moment(org.completeTimestamp), 'hours', true) <= pool.lifeHours)
    .map(org => JSON.stringify(org));
      
	if (goodOrgs.length === allMessages.length) {
		return `all the orgs in pool ${poolname} are fine`;
  } 
  
  await redis.del(poolname);
  
  if (goodOrgs.length > 0) {
    // put the good ones back
    logger.debug(`putting ${goodOrgs.length} back in ${poolname}`);
    await redis.lpush(poolname, ...goodOrgs);
  }

	const expiredOrgs = allOrgs
		.filter(org => 
      moment().diff(moment(org.completeTimestamp), 'hours', true) > pool.lifeHours
      && org.mainUser
      && org.mainUser.username
		)
		.map(org => JSON.stringify({ username: org.mainUser.username, delete: true }));
  
  if (expiredOrgs.length > 0 ) {
    await redis.rpush(orgDeleteExchange, ...expiredOrgs);  
  }
	return `queueing for deletion ${expiredOrgs.length} expired orgs from pool ${poolname}`;
};

const herokuExpirationCheck = async () => {
    const herokuCDSs = await getHerokuCDSs();

    if (herokuCDSs.length > 0) {
      if (!process.env.HEROKU_API_KEY) {
        logger.warn('there is no heroku API key');
      } else {
        for (const cds of herokuCDSs) {          
          // see if the org is deleted
          const queryResult = await execProm(`sfdx force:data:soql:query -u ${process.env.HUB_USERNAME} -q "select status from ScratchOrgInfo where SignupUsername='${cds.mainUser.username}'" --json`);
          try {          
            const status = JSON.parse(queryResult.stdout).result.records[0].Status;

            if (status === 'Deleted') {
              // if deleted, do the heroku delete thing
              for (const appName of await getAppNamesFromHerokuCDSs(cds.mainUser.username)) {
                await herokuDelete(appName);
                logger.debug(`deleted heroku app with name ${appName}`);
              }
            }
          } catch (e) {
            logger.error(`error checking hub for username ${cds.mainUser.username}`);
            logger.error(e);
          }
        }        
      }
    }
  };

export { checkExpiration, skimmer, herokuExpirationCheck };
