"use strict";
const versions_1 = require("../../versions");
const timedHook_1 = require("../timedHook");
const FORCE_PLUGINS = [
    'salesforcedx',
    'salesforce-alm',
    'force-language-services'
];
const MIN_VERSION = '41.2.0';
/**
 * A v6 CLI plugin preinstall hook that checks that the plugin's version is v6-compatible,
 * if it is recognized as a force namespace plugin.
 */
async function run(config, { plugin, tag }) {
    if (FORCE_PLUGINS.includes(plugin) && versions_1.isVersion(tag) && versions_1.compareVersions(tag, MIN_VERSION) < 0) {
        throw new Error(`The ${plugin} plugin can only be installed using a specific version when ` +
            `the version is greater than or equal to ${MIN_VERSION}.`);
    }
}
module.exports = timedHook_1.default('plugins:preinstall:version', run);
//# sourceMappingURL=verifyInstallVersion.js.map