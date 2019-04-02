import * as logger from 'heroku-logger';
import * as stripcolor from 'strip-color';
import * as util from 'util';

import * as utilities from './utilities';
import { redis } from './redisNormal';
import * as argStripper from './argStripper';

import { deployRequest, clientDataStructure, commandSummary } from './types';

const exec = util.promisify(require('child_process').exec);

const ex = 'deployMsg';

const lines = function(
  msgJSON: deployRequest,
  lines,
  redisPub,
  output: clientDataStructure
) {
  this.msgJSON = msgJSON;
  this.lines = lines;
  this.redisPub = redisPub;

  this.runLines = async function runLines() {
    logger.debug('starting the line runs');

    for (const line of this.lines) {
      let localLine = line;
      let summary: commandSummary;
      let shortForm: string;

      // if (localLine.includes('sfdx') !localLine.includes('--json')) {
      //   throw new Error(
      //     `Every line should have included --json by this point.  Cannot process ${localLine}`
      //   );
      // }
      logger.debug(localLine);

      // corrections and improvements for individual commands
      if (
        localLine.includes('sfdx force:org:open') &&
        !localLine.includes(' -r')
      ) {
        summary = commandSummary.OPEN;
        localLine = `${localLine} -r`;
      } else if (localLine.includes(':user:password')) {
        summary = commandSummary.PASSWORD_GEN;
      } else if (localLine.includes(':org:create')) {
        // handle the shane plugin and the stock commmand
        // no aliases allowed to keep the deployer from getting confused between deployments
        localLine = argStripper(localLine, '--setalias');
        localLine = argStripper(localLine, '-a');
        summary = commandSummary.ORG_CREATE;
      } else if (localLine.includes('sfdx force:source:push')) {
        summary = commandSummary.PUSH;
      } else if (localLine.includes('sfdx force:source:push')) {
        summary = commandSummary.PUSH;
      } else if (localLine.includes('sfdx force:source:push')) {
        summary = commandSummary.PUSH;
      } else if (localLine.includes('sfdx force:user:create')) {
        summary = commandSummary.USER_CREATE;
      } else if (localLine.includes('sfdx force:apex:execute')) {
        summary = commandSummary.APEX_EXEC;
      } else if (localLine.includes('sfdx force:user:permset')) {
        summary = commandSummary.PERMSET;
      } else if (localLine.includes('sfdx force:data:')) {
        summary = commandSummary.DATA;
      } else if (localLine.includes(':package:install')) {
        summary = commandSummary.PACKAGE;
      } else if (localLine.includes('sfdx force:mdapi:deploy')) {
        summary = commandSummary.DEPLOY;
      } else {
        logger.info('unhandled command will show up directly in the UI', {
          command: localLine,
          repo: `${msgJSON.username}/${msgJSON.repo}`
        });
      }
      // heroku deployer support  // if it's heroku:repo:deploy
      if (localLine.includes('sfdx shane:heroku:repo:deploy')) {
        if (!process.env.HEROKU_API_KEY) {
          // check that heroku API key is defined in process.env
          logger.error(
            'there is no HEROKU_API_KEY defined, but shane:heroku:repo:deploy is used in an .orgInit',
            {
              repo: `${msgJSON.username}/${msgJSON.repo}`
            }
          );
        }
        summary = commandSummary.HEROKU_DEPLOY;
        // if there's an org, align the expiration, otherwise default it to [?something]
        // logger.debug(`heroku app deploy: ${localLine}`);
        // visitor.event('sfdx event', 'heroku app deploy', this.msgJSON.template).send();
        // push an object to the herokuDeletes queue

        const days =
          parseInt(utilities.getArg(localLine, '-d'), 10) ||
          parseInt(utilities.getArg(localLine, '--days'), 10) ||
          7;

        const herokuDeleteMessage = {
          herokuDelete: true,
          appName:
            utilities.getArg(localLine, '-n') ||
            utilities.getArg(localLine, '--name'),
          expiration: Date.now() + days * 24 * 60 * 60 * 1000
        };

        redis.rpush('herokuDeletes', JSON.stringify(herokuDeleteMessage));
      }

      // the actual work and error handling
      let lineResult;

      // errors that we want to handle

      logger.debug(`running line-- ${localLine}`);

      try {
        lineResult = await exec(localLine, { cwd: `tmp/${msgJSON.deployId}` });
                
        if (localLine.includes('--json')) {
          let response = JSON.parse(stripcolor(lineResult.stdout));
          // returned a reasonable error but not a full-on throw

          if (response.status !== 0) {

            // you fail!
            output.errors.push({
              command: localLine,
              error: response.message,
              raw: response
            });
            logger.error(
              `error running line ${localLine} from ${msgJSON.username}/${
                msgJSON.repo
              }: ${response.message}`, response
            );
          } else {
            logger.debug('line returned status 0');
            if (summary === commandSummary.OPEN) {
              // temporary
              response = utilities.urlFix(response);
              output.mainUser.loginUrl = response.result.url;
              output.mainUser.username = response.result.username;
              output.openTimestamp = new Date();
            } else if (summary === commandSummary.ORG_CREATE) {
              output.orgId = response.result.orgId;
              output.mainUser.username = response.result.username;
              shortForm = `created org ${response.result.orgId} with username ${
                response.result.username
              }`;
            } else if (summary === commandSummary.PASSWORD_GEN) {
              output.mainUser.password = response.result.password;
              shortForm = `set password to ${
                response.result.password
              } for user ${response.result.username || output.mainUser.username}`;
            } else if (summary === commandSummary.USER_CREATE) {
              output.additionalUsers.push({
                username: response.result.fields.username
              });
              shortForm = `created user with username ${
                response.result.fields.username
              }`;
            }
          }

          // always
          output.commandResults.push({
            command: line,
            summary,
            raw: response,
            shortForm
          });
        } else {
          output.commandResults.push({
            command: line,
            raw: lineResult
          });
        }        

        // finally, emit the entire new data structure back to the web server to forward to the client after each line
        redisPub.publish(ex, JSON.stringify(output));
      } catch (e) {
        logger.error('a very serious error occurred on this line...in the catch section', e);
        // a more serious error...tell the client
        output.complete = true;
        output.errors.push({
          command: localLine,
          error: `${e.name}: ${e.message}`,
          raw: e
        });

        redisPub.publish(ex, JSON.stringify(output));

        // and throw so the requester can do the rest of logging to heroku logs and GA
        throw new Error(e);
      }
    } //end of the loop

    // we're done here
    output.complete = true;
    output.completeTimestamp = new Date();
    await Promise.all([
      redisPub.publish(ex, JSON.stringify(output)),
      exec('sfdx force:auth:logout -p', { cwd: `tmp/${msgJSON.deployId}` })
    ]);
    return output;
  };
};

export = lines;
