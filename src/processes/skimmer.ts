import * as logger from 'heroku-logger';
import * as utilities from '../lib/utilities';
import { skimmer, herokuExpirationCheck } from '../lib/skimmerSupport';

(async () => {
  try {
    if (utilities.checkHerokuAPI()){
      await Promise.all([skimmer(), herokuExpirationCheck()]);
    }
    process.exit(0);
  } catch (err){
    logger.error(err);
    process.exit(1);
  }
})();
