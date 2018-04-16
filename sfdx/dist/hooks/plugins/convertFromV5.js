"use strict";
const cli_engine_command_1 = require("cli-engine-command");
const timedHook_1 = require("../timedHook");
const color_1 = require("cli-engine-command/lib/color");
function run(config, { module }) {
    if (module.namespace) {
        const ns = module.namespace.name;
        module.commands = convertFromV5Commands(module.commands, ns);
        const topics = module.topics || (module.topic && [module.topic]);
        module.topics = convertFromV5Topics(topics, ns, module.namespace.description);
        delete module.namespace;
    }
}
function convertFromV5Commands(commands = [], ns) {
    return commands
        .map((cmd) => {
        if (cmd.namespace === ns) {
            cmd.topic = ns;
            return cmd;
        }
        cmd.topic = applyNamespace(cmd.topic, ns);
        cmd.buildHelp = (config) => {
            const help = cli_engine_command_1.Command.buildHelp.call(cmd, config);
            // Strip the possibly ANSI-colored '[flags]' suffix cli-engine appends to usage strings
            return help.replace(/(?:\u001b\[[0-9]+m)?\[flags\](?:\u001b\[[0-9]+m)?/, '');
        };
        // Do not use arrow function here because we need access to the command's properties
        cmd.buildHelpLine = function (config) {
            return [`${this.topic}:${this.command}`, color_1.color.dim(this.description)];
        };
        return cmd;
    });
}
function convertFromV5Topics(topics = [], ns, nsDescription) {
    return [{
            description: nsDescription,
            hidden: false,
            name: ns
        }].concat(topics.map((topic) => {
        topic.name = applyNamespace(topic.name, ns);
        return topic;
    }));
}
function hasNamespace(name, ns) {
    return name && name.indexOf(ns + ':') === 0;
}
function applyNamespace(name, ns) {
    return !hasNamespace(name, ns) ? `${ns}:${name}` : name;
}
module.exports = timedHook_1.default('plugins:parse:legacy', run);
//# sourceMappingURL=convertFromV5.js.map