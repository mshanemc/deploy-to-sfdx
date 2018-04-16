"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Module = require("module");
const path = require("path");
const fs = require("fs");
const cli_engine_config_1 = require("cli-engine-config");
const LazyModules_1 = require("./LazyModules");
const TypeCache_1 = require("./TypeCache");
const pjson = require('../../../package.json'); // tslint:disable-line no-var-requires
const cacheDir = cli_engine_config_1.buildConfig({ bin: pjson['cli-engine'].bin }).cacheDir;
const typeCacheFile = path.join(cacheDir, 'module-types.json');
const typeCache = new TypeCache_1.default(fs, typeCacheFile);
exports.typeCache = typeCache;
const lazyModules = new LazyModules_1.default(cacheDir, typeCache, Module);
/**
 * Start lazy loading type-compatible modules.
 */
function start() {
    if (lazyModules.isEnabled()) {
        return;
    }
    typeCache.load();
    process.on('exit', () => typeCache.save());
    lazyModules.enable();
}
exports.start = start;
//# sourceMappingURL=index.js.map