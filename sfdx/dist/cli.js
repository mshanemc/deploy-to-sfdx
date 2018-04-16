"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_1 = require("cli-engine");
const path = require("path");
const env_1 = require("./util/env");
const lazyModules = require("./experiments/lazyModules");
function create(version, channel) {
    const root = path.join(__dirname, '..');
    const pjson = require(path.join(root, 'package.json')); // tslint:disable-line
    // Require a dark feature envar to enable the lazy loading experiment
    if (env_1.default.getBoolean('SFDX_LAZY_LOAD_MODULES')) {
        lazyModules.start();
    }
    return new cli_engine_1.default({
        argv: process.argv.slice(1),
        config: configureAutoUpdate(env_1.default, {
            channel, pjson, root, version
        })
    });
}
exports.create = create;
exports.UPDATE_DISABLED_INSTALLER = 'Manual and automatic CLI updates have been disabled by setting "SFDX_AUTOUPDATE_DISABLE=true". ' +
    'To check for a new version, unset that environment variable.';
exports.UPDATE_DISABLED_OTHER = 'Use "npm install --global sfdx-cli" to update npm-based installations.';
exports.UPDATE_DISABLED_DEMO = 'Manual and automatic CLI updates have been disabled in DEMO mode. ' +
    'To check for a new version, unset the environment variable SFDX_ENV.';
function configureAutoUpdate(envars, config) {
    const sfdxEnv = envars.get('SFDX_ENV');
    if (sfdxEnv && sfdxEnv.toLowerCase() === 'demo') {
        // Disable autoupdates in demo mode
        envars.setBoolean('SFDX_AUTOUPDATE_DISABLE', true);
        config.updateDisabled = exports.UPDATE_DISABLED_DEMO;
        return config;
    }
    if (envars.getBoolean('SFDX_INSTALLER')) {
        if (envars.getBoolean('SFDX_AUTOUPDATE_DISABLE')) {
            config.updateDisabled = exports.UPDATE_DISABLED_INSTALLER;
        }
        return config;
    }
    if (!envars.get('SFDX_AUTOUPDATE_DISABLE')) {
        // Disable autoupdates if run from an npm install or in local dev, if not explicitly set
        envars.setBoolean('SFDX_AUTOUPDATE_DISABLE', true);
    }
    if (envars.getBoolean('SFDX_AUTOUPDATE_DISABLE')) {
        config.updateDisabled = exports.UPDATE_DISABLED_OTHER;
    }
    return config;
}
exports.configureAutoUpdate = configureAutoUpdate;
//# sourceMappingURL=cli.js.map