import * as moment from 'moment';
import { redis } from './redisNormal';
import { poolOrg, poolConfig } from './types';
import * as utilities from './utilities';
import * as util from 'util';
import * as logger from 'heroku-logger';
import * as request from 'request-promise-native';

const exec = util.promisify(require('child_process').exec);

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
  const allOrgs:poolOrg[] = allMessages.map( msg => JSON.parse(msg));

	const goodOrgs = allOrgs
		.filter(org => moment().diff(moment(org.createdDate), 'hours', true) <= pool.lifeHours)
    .map(org => JSON.stringify(org));
      
	if (goodOrgs.length === allMessages.length) {
		return `all the orgs in pool ${poolname} are fine`;
	} else if (goodOrgs.length > 0) {
    await redis.del(poolname);
    // put the good ones back
    await redis.lpush(poolname, ...goodOrgs);
  }

	const expiredOrgs = allOrgs
		.filter(org => 
      moment().diff(moment(org.createdDate), 'hours', true) > pool.lifeHours
      && org.displayResults
      && org.displayResults.username
		)
		.map(org => JSON.stringify({ username: org.displayResults.username, delete: true }));

  await redis.rpush('poolDeploys', ...expiredOrgs);
  const builders = [];
  const builderCommand = utilities.getPoolDeployerCommand();
  while (builders.length < expiredOrgs.length) {
    builders.push(exec(builderCommand));
  }
	await Promise.all(builders);
	return `removing ${expiredOrgs.length} expired orgs from pool ${poolname}`;
};

const herokuExpirationCheck = async () => {
    const herokuDeletes = await redis.lrange('herokuDeletes', 0, -1);
    await redis.del('herokuDeletes');
  
    if (herokuDeletes.length > 0) {
      if (!process.env.HEROKU_API_KEY) {
        logger.warn('there is no heroku API key');
      } else {
        const execs = [];
  
        const headers = {
          Accept: 'application/vnd.heroku+json; version=3',
          Authorization: `Bearer ${process.env.HEROKU_API_KEY}`
        };
  
        herokuDeletes.forEach((raw) => {
          const herokuDelete = JSON.parse(raw);
          if (moment(herokuDelete.expiration).isBefore(moment())) {
            logger.debug(`deleting heroku app: ${herokuDelete.appName}`);
            execs.push(
              request.delete({
                url: `https://api.heroku.com/apps/${herokuDelete.appName}`,
                headers,
                json: true
              })
            );
          } else {
            execs.push(
              redis.rpush('herokuDeletes', JSON.stringify(herokuDelete))
            );
          }
        });
  
        const results = await Promise.all(execs);
        results.forEach(result => logger.debug(result));
      }
    }
  };

export { checkExpiration, skimmer, herokuExpirationCheck };
