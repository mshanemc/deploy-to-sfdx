"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Debug = require("debug");
/**
 * Adds debug timing around hook executions.
 *
 * @param name The debugging name of the hook; `sfdx:hook:` is automatically added as a prefix
 * @param hook The hook to wrap with debug timings
 */
function timedHook(name, hook) {
    const debug = Debug(`sfdx:hook:${name}`);
    return async (...args) => {
        debug('enter');
        try {
            return await hook(...args);
        }
        finally {
            debug('exit');
        }
    };
}
exports.default = timedHook;
//# sourceMappingURL=timedHook.js.map