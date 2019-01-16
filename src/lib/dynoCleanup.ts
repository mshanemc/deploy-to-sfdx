// uses the heroku API to look for one-off dynos that have been up too long (whatever that is defined as)
import * as Heroku from 'heroku-client';
import * as logger from 'heroku-logger';
import * as moment from 'moment';

import * as utilities from './utilities';
import { herokuDyno } from './types';

(async () => {
  if (utilities.checkHerokuAPI()) {
    try {
      const heroku = new Heroku({ token: process.env.HEROKU_API_KEY });
      const commands = [];
      const runDynos = <herokuDyno[]>(
        await heroku.get(`/apps/${process.env.HEROKU_APP_NAME}/dynos`)
      );
      runDynos.forEach((dyno) => {
        if (
          dyno.type === 'run' &&
          moment(dyno.created_at).isBefore(moment().subtract(20, 'minutes'))
        ) {
          const loggerOutput = `dynoCleanup: stopping a run dyno started at ${
            dyno.created_at
          } with command ${dyno.command}`;
          logger.debug(loggerOutput);
          const url = `/apps/${process.env.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`;
          commands.push(heroku.post(url));
        } else if (dyno.type === 'run') {
          logger.debug(`dynoCleanup: dyno is fairly recent ${dyno.created_at}`);
        }
      });
      logger.debug(`dynoCleanup: stopping ${commands.length} run dynos`);
      await Promise.all(commands);
    } catch (err) {
      logger.error('dynoCleanup', err);
    }
  }
  process.exit(0);
})();
