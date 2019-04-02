import * as logger from 'heroku-logger';
import * as request from 'request-promise-native';

import { deployRequest, poolConfig, openResult } from './types';
import { isLocal } from './amIlocal';

const exec = require('child_process').exec;

const utilities = {
  getKey: async (msgJSON: deployRequest): Promise<string> => {
    if (!msgJSON.username) {
      throw new Error('msg does not have username');
    }
    if (!msgJSON.repo) {
      throw new Error('msg does not have repo');
    }

    let key = `${msgJSON.username}.${msgJSON.repo}`;
    if (msgJSON.branch) {
      key = `${msgJSON.username}.${msgJSON.repo}.${msgJSON.branch}`;
    }
    return key;
  },

  getPoolConfig: async (): Promise<poolConfig[]> => {
    // TODO: fallback as a singleton?
    if (!process.env.POOLCONFIG_URL) {
      return;
    }
    try {
      return JSON.parse(await request(process.env.POOLCONFIG_URL));
    } catch (error) {
      throw new Error(error);
    }
  },

  getPool: async (username: string, repo: string): Promise<poolConfig> => {
    const pools = await module.exports.getPoolConfig();
    if (!pools || !pools.find) {
      return;
    }

    const foundPool = pools.find(
      pool => pool.user === username && pool.repo === repo
    );
    if (!foundPool) {
       // go back and build it the normal way!
    } else {
      return foundPool;
    }
  },

  runHerokuBuilder: (): void => {

    if (process.env.HEROKU_API_KEY && process.env.HEROKU_APP_NAME && !isLocal()) {
      exec(
        `heroku run:detached oneoffbuilder -a ${process.env.HEROKU_APP_NAME}`
      );
    } else if (isLocal()) {
      logger.debug('run one-off dynos via heroku local');
      exec('heroku local oneoffbuilder');
    } else {
      logger.warn('no heroku api key. not running one-off dynos');
    }
  },

  getPoolDeployerCommand: (): string => {
    if (process.env.HEROKU_API_KEY && process.env.HEROKU_APP_NAME && !isLocal()) {
      return `heroku run:detached pooldeployer -a ${process.env.HEROKU_APP_NAME}`;
    } else if (isLocal()) {
      logger.debug('run poolbuilder dynos via heroku local');
      return 'heroku local pooldeployer';
    } else {
      logger.warn('unable to run pooldeployers...missing api key or app name');
    }
  },

  checkHerokuAPI: (): boolean => {
    // we allow not to exist if running locally
    if (process.env.HEROKU_API_KEY || isLocal()) {
      return true;
    } else {
      throw new Error('HEROKU_API_KEY is not defined!');
    }
  },

  loggerFunction: (result): void => {
    if (result.stdout) {
      logger.debug(result.stdout);
    }
    if (result.stderr) {
      logger.debug(result.stderr);
    }
  },

  // fix double // inside a url by sfdx cli force:org:open
  urlFix: (input: openResult): openResult => {
    if (input.result.url && input.result.url.includes('.com//secur/')) {
      logger.warn(`multiple slash in open url ${input.result.url}`);
      input.result.url = input.result.url.replace(
        '.com//secur/',
        '.com/secur/'
      );
    }
    return input;
  },

  getCloneCommand: (depReq: deployRequest) => {
    let gitCloneCmd = `git clone https://github.com/${depReq.username}/${
      depReq.repo
    }.git ${depReq.deployId}`;
    // special handling for branches
    if (depReq.branch) {
      // logger.debug('It is a branch!');
      gitCloneCmd = `git clone -b ${
        depReq.branch
        } --single-branch https://github.com/${depReq.username}/${
        depReq.repo
        }.git ${depReq.deployId}`;
      // logger.debug(gitCloneCmd);
    }
    return gitCloneCmd;
  },

  getArg: (cmd: string, parameter: string): string => {
    cmd = cmd.concat(' ');
    const bufferedParam = ' '.concat(parameter).concat(' ');
    // takes a command line command and removes a parameter.  Make noarg true if it's a flag (parameter with no arguments), like sfdx force:org:create -s

    // ex:
    // cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
    // parameter = '-a'

    // quickly return if it doesn't exist
    if (!cmd.includes(bufferedParam)) {

    } else {
      // find the string
      const paramStartIndex =
        cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;

      const paramEndIndex = paramStartIndex + parameter.length - 1; // because there'll be a space, and because origin
      const paramValueStart = paramEndIndex + 2;
      let paramValueEnd;
      // if it starts with a ` or ' or " we need to find the other end.  Otherwise, it's a space
      if (
        cmd.charAt(paramValueStart) === '"' ||
        cmd.charAt(paramValueStart) === '\'' ||
        cmd.charAt(paramValueStart) === '`'
      ) {
        // logger.debug(`it is a quoted string starting with ${cmd.charAt(paramValueStart)}`);
        const quoteEnd = cmd.indexOf(
          cmd.charAt(paramValueStart),
          paramValueStart + 1
        );
        if (cmd.charAt(quoteEnd + 1) === ' ') {
          paramValueEnd = quoteEnd;
        } else {
          paramValueEnd = cmd.indexOf(' ', quoteEnd + 1) - 1;
        }
      } else {
        // normal type with a space
        paramValueEnd = cmd.indexOf(' ', paramValueStart) - 1;
      }
      return cmd.substring(paramValueStart, paramValueEnd + 1).trim();
    }
  }
};

export = utilities;
