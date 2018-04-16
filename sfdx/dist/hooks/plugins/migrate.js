"use strict";
const PluginMigrator_1 = require("../../legacy/PluginMigrator");
const timedHook_1 = require("../timedHook");
async function run(config) {
    return await PluginMigrator_1.default.run(config);
}
module.exports = timedHook_1.default('init:plugins:migrate', run);
//# sourceMappingURL=migrate.js.map