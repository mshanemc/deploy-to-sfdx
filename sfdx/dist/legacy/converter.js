"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_command_1 = require("cli-engine-command");
const vars = require("cli-engine-heroku/lib/vars");
function convertFromV5(c) {
    class V5 extends cli_engine_command_1.Command {
        async run() {
            const flags = this.flags;
            const ctx = {
                apiHost: vars.default.apiHost,
                apiToken: '',
                apiUrl: vars.default.apiUrl,
                app: flags.app,
                args: c.variableArgs ? this.argv : this.args,
                auth: {},
                config: this.config,
                cwd: process.cwd(),
                debug: this.config.debug,
                flags,
                gitHost: vars.default.gitHost,
                herokuDir: this.config.cacheDir,
                httpGitHost: vars.default.httpGitHost,
                org: flags.org,
                supportsColor: this.out.color.enabled,
                team: flags.team,
                version: this.config.userAgent
            };
            const ansi = require('ansi-escapes');
            process.once('exit', () => {
                if (process.stderr.isTTY) {
                    process.stderr.write(ansi.cursorShow);
                }
            });
            Object.keys(ctx.flags).forEach((k) => ctx.flags[k] === undefined && delete ctx.flags[k]);
            return c.run(ctx);
        }
    }
    V5.topic = c.topic;
    V5.command = c.command || '';
    V5.description = c.description || '';
    V5.hidden = !!c.hidden;
    V5.args = c.args || [];
    V5.flags = convertFlagsFromV5(c.flags);
    V5.variableArgs = !!c.variableArgs;
    V5.help = c.help || '';
    V5.usage = c.usage || '';
    V5.aliases = c.aliases || [];
    if (c.needsApp || c.wantsApp) {
        V5.flags.app = cli_engine_command_1.flags.app({ required: !!c.needsApp });
        V5.flags.remote = cli_engine_command_1.flags.remote();
    }
    if (c.needsOrg || c.wantsOrg) {
        const opts = { required: !!c.needsOrg, hidden: false, description: 'organization to use' };
        V5.flags.org = cli_engine_command_1.flags.org(opts);
    }
    return V5;
}
exports.convertFromV5 = convertFromV5;
function convertFlagsFromV5(flags) {
    if (!flags) {
        return {};
    }
    if (!Array.isArray(flags)) {
        return flags;
    }
    return flags.reduce((converted, flag) => {
        const opts = {
            char: flag.char,
            description: flag.description,
            hidden: flag.hidden,
            optional: flag.optional,
            parse: flag.parse,
            required: flag.required
        };
        Object.keys(opts).forEach((k) => opts[k] === undefined && delete opts[k]);
        converted[flag.name] = flag.hasValue ? cli_engine_command_1.flags.string(opts) : cli_engine_command_1.flags.boolean(opts);
        return converted;
    }, {});
}
//# sourceMappingURL=converter.js.map