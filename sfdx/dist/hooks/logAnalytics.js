"use strict";
const cp = require("child_process");
const Debug = require("debug");
const fs = require("fs");
const path = require("path");
const timedHook_1 = require("./timedHook");
const debug = Debug('sfdx:analytics');
function run(config, opts) {
    try {
        const start = Date.now();
        const command = opts.Command;
        // Only log usage for commands with plugins
        if (command && command.plugin) {
            debug('setting up exit handler');
            process.on('exit', (status) => {
                const logFile = path.join(config.cacheDir, 'analytics.log');
                debug(`using ${logFile} for usage error logging`);
                const fd = fs.openSync(logFile, 'a');
                cp.spawn(process.argv[0], [
                    path.join(__dirname, '../processes/logUsage'),
                    JSON.stringify({
                        config,
                        plugin: command.plugin ? { name: command.plugin.name, version: command.plugin.version } : undefined,
                        commandId: command.id,
                        time: Date.now() - start,
                        status
                    })
                ], {
                    detached: !config.windows,
                    stdio: ['ignore', fd, fd]
                }).unref();
                debug(`spawned usage "${process.argv[0]} ${path.join(__dirname, '../processes/logUsage')}"`);
            });
        }
        else {
            debug('no plugin found for analytics');
        }
    }
    catch (err) {
        debug(`error tracking usage: ${err.message}`);
    }
}
module.exports = timedHook_1.default('analytics', run);
//# sourceMappingURL=logAnalytics.js.map