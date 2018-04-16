"use strict";
const timedHook_1 = require("../../hooks/timedHook");
const lazyModules = require("./index");
function run(config) {
    // Reset the type cache on CLI or plugin updates in case a dependency has changed types
    lazyModules.typeCache.reset();
}
module.exports = timedHook_1.default('update:lazy-modules', run);
//# sourceMappingURL=updateHook.js.map