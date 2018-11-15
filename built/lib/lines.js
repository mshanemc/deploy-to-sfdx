"use strict";
const logger = require("heroku-logger");
const util = require("util");
const utilities = require("./utilities");
const redis = require("./redisNormal");
const argStripper = require("./argStripper");
const exec = util.promisify(require('child_process').exec);
const ex = 'deployMsg';
const lines = function (msgJSON, lines, redisPub, visitor) {
    this.msgJSON = msgJSON;
    this.lines = lines;
    this.redisPub = redisPub;
    this.visitor = visitor;
    this.runLines = async function runLines() {
        logger.debug('starting the line runs');
        for (const line of this.lines) {
            let localLine = line;
            logger.debug(localLine);
            // corrections and improvements for individual commands
            if (localLine.includes('sfdx force:org:open') && !localLine.includes(' -r')) {
                localLine = `${localLine} -r --json`;
                logger.debug(`org open command : ${localLine}`);
                visitor.event('sfdx event', 'org open', this.msgJSON.template).send();
            }
            if (localLine.includes(':user:password') && !localLine.includes(' --json')) {
                localLine = `${localLine} --json`;
                logger.debug(`org password command : ${localLine}`);
                visitor.event('sfdx event', 'password gen', this.msgJSON.template).send();
            }
            // handle the shane plugin and the stock commmand
            if (localLine.includes(':org:create')) {
                // no aliases allowed to keep the deployer from getting confused between deployments
                localLine = argStripper(localLine, '--setalias');
                localLine = argStripper(localLine, '-a');
                localLine = `${argStripper(localLine, '--json', true)} --json`;
                logger.debug(`org create command : ${localLine}`);
                visitor.event('sfdx event', 'org creation', this.msgJSON.template).send();
            }
            if (localLine.includes('sfdx force:source:push') && !localLine.includes(' --json')) {
                localLine = `${localLine} --json`;
                logger.debug(`source push command : ${localLine}`);
                visitor.event('sfdx event', 'source push', this.msgJSON.template).send();
            }
            // heroku deployer support  // if it's heroku:repo:deploy
            if (localLine.includes('sfdx shane:heroku:repo:deploy')) {
                if (!process.env.HEROKU_API_KEY) { // check that heroku API key is defined in process.env
                    logger.error('there is no HEROKU_API_KEY defined, but shane:heroku:repo:deploy is used in an .orgInit');
                }
                localLine = argStripper(localLine, '--json', true);
                localLine = `${localLine} --json`;
                // if there's an org, align the expiration, otherwise default it to [?something]
                logger.debug(`heroku app deploy: ${localLine}`);
                visitor.event('sfdx event', 'heroku app deploy', this.msgJSON.template).send();
                // push an object to the herokuDeletes queue
                const days = utilities.getArg(localLine, '-d') || utilities.getArg(localLine, '--days') || 7;
                const herokuDeleteMessage = {
                    herokuDelete: true,
                    appName: utilities.getArg(localLine, '-n') || utilities.getArg(localLine, '--name'),
                    expiration: Date.now() + (days * 24 * 60 * 60 * 1000)
                };
                redis.rpush('herokuDeletes', JSON.stringify(herokuDeleteMessage));
            }
            // the actual work and error handling
            let lineResult;
            let keepTrying = true;
            // errors that we want to handle
            while (keepTrying) {
                try {
                    logger.debug(`running line-- ${localLine}`);
                    lineResult = await exec(localLine);
                    keepTrying = false;
                }
                catch (err) {
                    console.log(err);
                    if (err.stderr.includes('The Lightning Experience-enabled custom domain is unavailable.')) {
                        logger.error(`Custom Domain Timed out.  Retrying '${localLine}'...`);
                        redisPub.publish(ex, utilities.bufferKey('The domain is taking longer than usual.  Retrying the org open command', msgJSON.deployId));
                    }
                    else {
                        // a real error
                        console.error('Error (lines.js): ', err);
                        redisPub.publish(ex, utilities.bufferKey(`ERROR: ${err}`, msgJSON.deployId));
                        visitor.event('deploy error', this.msgJSON.template, err).send();
                        keepTrying = false;
                    }
                }
            }
            if (lineResult) {
                if (localLine.includes('heroku ')) {
                    const tempOut = lineResult.stdout;
                    lineResult.stdout = lineResult.stderr;
                    lineResult.stderr = tempOut;
                }
                if (lineResult.stdout) {
                    const fixedStdout = utilities.urlFix(lineResult.stdout);
                    logger.debug(fixedStdout);
                    redisPub.publish(ex, utilities.bufferKey(fixedStdout, msgJSON.deployId));
                }
                if (lineResult.stderr && !lineResult.stderr.includes('sfdx-cli: update available')) {
                    logger.error(lineResult.stderr);
                    redisPub.publish(ex, utilities.bufferKey(`ERROR ${lineResult.stderr}`, msgJSON.deployId));
                    visitor.event('deploy error', this.msgJSON.template, lineResult.stderr).send();
                }
            }
        }
    };
};
module.exports = lines;
