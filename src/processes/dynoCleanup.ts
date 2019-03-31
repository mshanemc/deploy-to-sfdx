// uses the heroku API to look for one-off dynos that have been up too long (whatever that is defined as)
import * as Heroku from 'heroku-client';
import * as logger from 'heroku-logger';
import * as moment from 'moment';

import * as utilities from '../lib/utilities';
import { herokuDyno } from '../lib/types';

(async () => {
  // validations that we can process these
  if ( !utilities.checkHerokuAPI() || !process.env.HEROKU_APP_NAME ) {
    logger.error('dynoCleanup cannot run');
    process.exit(1);
  } 

  try {
    const heroku = new Heroku({ token: process.env.HEROKU_API_KEY });
    const runDynos = <herokuDyno[]> await heroku.get(`/apps/${process.env.HEROKU_APP_NAME}/dynos`);

    await Promise.all( 
      runDynos
        .filter( dyno => dyno.type === 'run')
        .filter( dyno => moment(dyno.created_at).isBefore(moment().subtract(20, 'minutes')))
        .map( dyno => heroku.post(`/apps/${process.env.HEROKU_APP_NAME}/dynos/${dyno.id}/actions/stop`))
    );

  } catch (err) {
    logger.error('dynoCleanup', err);
  }
  
  process.exit(0);
})();
