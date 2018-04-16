"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("../../util/env");
const Debug = require("debug");
const doTrace = env_1.default.getBoolean('SFDX_LAZY_LOAD_MODULES') && env_1.default.getBoolean('SFDX_LAZY_LOAD_MODULES_TRACE');
exports.debug = Debug('sfdx:lazy-modules');
exports.trace = doTrace ? exports.debug : (...args) => { };
//# sourceMappingURL=debug.js.map