// uses the heroku API to look for one-off dynos that have been up too long (whatever that is defined as)
const Heroku = require('heroku-client');
const logger = require('heroku-logger');
const moment = require('moment');

const heroku = new Heroku({ token: process.env.HEROKU_API_KEY });
const commands = [];

const stopOldDynos = async () => {
  const runDynos = await heroku.get(`/apps/${process.env.HEROKU_APP_NAME}/dynos`);
  runDynos.forEach((dyno) => {
    if (dyno.type === 'run' && moment(dyno.created_at).isBefore(moment().subtract(20, 'minutes'))) {
      logger.debug(`stopping a run dyno started at ${dyno.created_at} with command ${dyno.command}`);
      commands.push(heroku.post(`/apps/${process.env.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`));
    } else if (dyno.type === 'run') {
      logger.debug(`dyno is fairly recent ${dyno.created_at}`);
    }
  });
  logger.debug(`stopping ${commands.length} run dynos`);
  const results = await Promise.all(commands);
};

stopOldDynos()
.then(() => {
  process.exit(0);
})
.catch((err) => {
  logger.error(err);
  process.exit(1);
});

// const checkExpiration = async (pool) => {

//   const poolname = `${pool.user}.${pool.repo}`;
//   const poolOrg = await redis.lpop(poolname);

//   if (!poolOrg) {
//     return `pool ${poolname} is empty`;
//   }

//   const msgJSON = JSON.parse(poolOrg);
//   if (moment().diff(moment(msgJSON.createdDate)) > pool.lifeHours * 60 * 60 * 1000) {
//     // it's gone if we don't put it back

//     // create the delete message
//     if (msgJSON.displayResults && msgJSON.displayResults.username) {
//       await redis.rpush('poolDeploys', JSON.stringify({
//         username: msgJSON.displayResults.username,
//         delete: true
//       }));
//     } else {
//       logger.warn('pool org did not have a username');
//       logger.warn(msgJSON);
//     }
//     await exec(`heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`);
//     return `removed an expired org from pool ${poolname}`;
//   } else {
//     await redis.lpush(poolname, JSON.stringify(msgJSON));
//     return `all the orgs in pool ${poolname} are fine`;
//   }
// };

// const skimmer = async () => {
//   const pools = await utilities.getPoolConfig();
//   const promises = [];

//   pools.forEach((pool) => {
//     promises.push(checkExpiration(pool));
//   });

//   const results = await Promise.all(promises);
//   results.forEach(result => logger.debug(result));

// };

// const herokuExpirationCheck = async () => {

//   const herokuDeletes = await redis.lrange('herokuDeletes', 0, -1);
//   await redis.del('herokuDeletes');

//   if (herokuDeletes.length > 0) {
//     if (!process.env.HEROKU_API_KEY) {
//       logger.warn('there is no heroku API key');
//     } else {
//       const execs = [];

//       const headers = {
//         Accept: 'application/vnd.heroku+json; version=3',
//         Authorization: `Bearer ${process.env.HEROKU_API_KEY}`
//       };

//       herokuDeletes.forEach((raw) => {
//         const herokuDelete = JSON.parse(raw);
//         if (moment(herokuDelete.expiration).isBefore(moment())) {
//           logger.debug(`deleting heroku app: ${herokuDelete.appName}`);
//           execs.push(request.delete({
//             url: `https://api.heroku.com/apps/${herokuDelete.appName}`,
//             headers,
//             json: true
//           }));
//         } else {
//           execs.push(redis.rpush('herokuDeletes', JSON.stringify(herokuDelete)));
//         }
//       });

//       const results = await Promise.all(execs);
//       results.forEach(result => logger.debug(result));

//     }

//   }

// };


// Promise.all([skimmer(), herokuExpirationCheck()])
//   .then(() => process.exit(0))
//   .catch(err => logger.error(err));
