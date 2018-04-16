"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
class AnalyticsCommand {
    constructor(config) {
        this.config = config;
    }
    get analyticsPath() {
        return path.join(this.config.cacheDir, 'analytics.json');
    }
    async record(plugin, commandId, runtime, status) {
        if (!plugin) {
            return;
        }
        const analyticsJSON = await this.readJSON();
        analyticsJSON.commands.push({
            command: commandId,
            language: 'node',
            os: this.config.platform,
            plugin: plugin && plugin.name,
            plugin_version: plugin && plugin.version,
            shell: this.config.shell,
            valid: true,
            version: this.config.version,
            runtime,
            status
        });
        await this.writeJSON(analyticsJSON);
    }
    async clear() {
        await this.writeJSON(this.initialAnalyticsJSON());
    }
    async readJSON() {
        try {
            const analytics = await fs.readJSON(this.analyticsPath);
            analytics.commands = analytics.commands || [];
            return analytics;
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
            return this.initialAnalyticsJSON();
        }
    }
    initialAnalyticsJSON() {
        return {
            commands: [],
            schema: 1
        };
    }
    async writeJSON(analyticsJSON) {
        return fs.outputJson(this.analyticsPath, analyticsJSON);
    }
}
exports.default = AnalyticsCommand;
//# sourceMappingURL=analytics.js.map