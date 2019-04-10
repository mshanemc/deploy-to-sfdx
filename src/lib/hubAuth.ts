import * as fs from 'fs';
import * as logger from 'heroku-logger';

import { isLocal } from './amIlocal';
import { exec } from '../lib/execProm';

const getKeypath = async () => {
  
  if (isLocal()) {
    // I'm fairly local
    logger.debug('hubAuth...using local key');
    if (process.env.LOCAL_ONLY_KEY_PATH) {
      return process.env.LOCAL_ONLY_KEY_PATH;
    } else {
      logger.error(`isLocal, but no local keypath. ${process.env.LOCAL_ONLY_KEY_PATH}`);
    }
  } else {
    // we're doing it in the cloud
    logger.debug('hubAuth...using key from heroku environment');
    if (!fs.existsSync('/app/tmp/server.key')) {
      fs.writeFileSync('/app/tmp/server.key', process.env.JWTKEY, 'utf8');
    }
    return '/app/tmp/server.key';
  }
};

const auth = async () => {
  // where will our cert live?
  const keypath = await getKeypath();

  try {
    if (!isLocal()) {
      // not local, so link the plugin.  local runs will hae it already linked.
      logger.debug('hubAuth: updating plugin');
      await exec('sfdx plugins:link node_modules/shane-sfdx-plugins');
    }

    if (process.env.SFDX_PRERELEASE) {
      // not local, so link the plugin.  local runs will hae it already linked.
      logger.debug('hubAuth: installing pre-release plugin for sfdx');
      await exec('sfdx plugins:install salesforcedx@pre-release');
    }

    if (process.env.HEROKU_API_KEY) {
      await exec('heroku update');
    }

    await exec(
      `sfdx force:auth:jwt:grant --clientid ${
        process.env.CONSUMERKEY
      } --username ${
        process.env.HUB_USERNAME
      } --jwtkeyfile ${await keypath} --setdefaultdevhubusername -a hub --json`
    );
  } catch (err) {
    logger.error('hubAuth', err);
    process.exit(1);
  }
  logger.debug('hubAuth: complete');
  return keypath;
};

export { auth, getKeypath };
