"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug = require("debug");
const fs = require("fs-extra");
const path = require("path");
const lock_1 = require("cli-engine/lib/lock");
const cli_ux_1 = require("cli-ux");
const color_1 = require("cli-engine-command/lib/color");
const debug = Debug('sfdx:plugins:migrate');
class PluginMigrator {
    constructor(config, cliUx, userPluginsPjsonV5Path, userPluginsPjsonV6Path, lock) {
        this.config = config;
        this.cliUx = cliUx;
        this.userPluginsPjsonV5Path = userPluginsPjsonV5Path;
        this.userPluginsPjsonV6Path = userPluginsPjsonV6Path;
        this.lock = lock;
        this.corePlugins = ((config.pjson || {})['cli-engine'] || {}).plugins || [];
    }
    static run(config) {
        const cliUx = new cli_ux_1.CLI();
        if (!config.dataDir) {
            return;
        }
        const userPluginsDir = path.join(config.dataDir, 'plugins');
        const userPluginsPjsonV5Path = path.join(userPluginsDir, 'plugins.json');
        const userPluginsPjsonV6Path = path.join(userPluginsDir, 'package.json');
        return new PluginMigrator(config, cliUx, userPluginsPjsonV5Path, userPluginsPjsonV6Path, new lock_1.default(config)).run();
    }
    async run() {
        // Short circuit quickly without having to acquire the writer lock
        if (fs.existsSync(this.userPluginsPjsonV6Path) || !fs.existsSync(this.userPluginsPjsonV5Path)) {
            debug('no v5 plugins need migration');
            return;
        }
        const pluginsJson = this.readPluginsJson();
        if (!pluginsJson) {
            debug('no v5 plugins read');
            return false;
        }
        const downgrade = await this.lock.upgrade();
        try {
            this.migratePlugins(pluginsJson);
        }
        finally {
            await downgrade();
        }
    }
    migratePlugins(pluginsJson) {
        // Prevent two parallel migrations from happening in case of a race
        if (fs.existsSync(this.userPluginsPjsonV6Path)) {
            debug('migration race detected, nothing left to do');
            return;
        }
        debug('migrating %s plugin%s', pluginsJson.length, pluginsJson.length === 1 ? '' : 's');
        if (pluginsJson.length > 0) {
            if (pluginsJson.filter((plugin) => !this.corePlugins.includes(plugin.name)).length !== 0) {
                this.cliUx.warn(color_1.color.bold.blue('v5 plug-ins found -- Complete your update to v6:'));
            }
            for (const plugin of pluginsJson) {
                this.migratePlugin(plugin.name, plugin.tag);
            }
        }
        // Remove the old v5 plugins file to prevent the migrator from running again
        if (fs.existsSync(this.userPluginsPjsonV5Path)) {
            try {
                debug('removing v5 plugins file');
                fs.removeSync(this.userPluginsPjsonV5Path);
            }
            catch (err) {
                this.cliUx.error(err);
            }
        }
    }
    migratePlugin(name, tag) {
        let message;
        if (tag === 'symlink') {
            message = `- ${color_1.color.bold(name)} -- To re-link, run ${color_1.color.green('sfdx plugins:link <path>')}`;
        }
        else if (this.corePlugins.includes(name)) {
            message = `- ${color_1.color.bold(name)} is now a core plug-in -- Use ${color_1.color.green('sfdx plugins --core')} to view its version`;
        }
        else {
            message = `- ${color_1.color.bold(name)} -- To re-install, run ${color_1.color.green(`sfdx plugins:install ${name}${tag ? '@' : ''}${tag}`)}`;
        }
        this.cliUx.warn(`${message}`);
    }
    readPluginsJson() {
        try {
            debug('reading plugins.json');
            const plugins = fs.readJsonSync(this.userPluginsPjsonV5Path);
            if (!Array.isArray(plugins)) {
                throw new Error('plugins.json does not contain an array');
            }
            if (plugins.length === 0) {
                debug('zero length plugins array read');
                return;
            }
            return plugins;
        }
        catch (err) {
            debug(err.message);
        }
    }
}
exports.default = PluginMigrator;
//# sourceMappingURL=PluginMigrator.js.map