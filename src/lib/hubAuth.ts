import * as fs from 'fs';
import * as logger from 'heroku-logger';
import * as util from 'util';

const exec = util.promisify(require('child_process').exec);

const getKeypath = async () => {
  if (process.env.LOCAL_ONLY_KEY_PATH) {
    // I'm fairly local
    logger.debug('hubAuth...using local key');
    return process.env.LOCAL_ONLY_KEY_PATH;
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
  logger.debug('hubAuth: updating plugin');
  const keypath = await getKeypath();

  try {
    if (process.env.JWTKEY) {
      // not local, so link the plugin.  local runs will hae it already linked.
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
