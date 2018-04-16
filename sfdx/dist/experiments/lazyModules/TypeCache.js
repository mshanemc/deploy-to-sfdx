"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NamedError_1 = require("../../util/NamedError");
const debug_1 = require("./debug");
class TypeCache {
    constructor(fsLib, cacheFile, values = {}) {
        this.fsLib = fsLib;
        this.cacheFile = cacheFile;
        this.values = values;
        this.changed = false;
    }
    load() {
        let json;
        try {
            debug_1.debug('loading type cache from %s', this.cacheFile);
            json = this.fsLib.readFileSync(this.cacheFile).toString('utf8');
            debug_1.debug('loaded type cache');
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                debug_1.debug('type cache not found');
                return false;
            }
            throw err;
        }
        try {
            debug_1.debug('parsing type cache');
            const values = JSON.parse(json);
            this.values = Object.assign(this.values, values);
            debug_1.debug('parsed type cache');
        }
        catch (err) {
            debug_1.debug('removing corrupted type cache');
            this.fsLib.unlinkSync(this.cacheFile);
            return false;
        }
        return true;
    }
    save() {
        debug_1.debug('saving type cache to %s', this.cacheFile);
        if (!this.changed) {
            debug_1.debug('no changes to save');
            return false;
        }
        const json = JSON.stringify(this.values);
        try {
            this.fsLib.writeFileSync(this.cacheFile, json);
        }
        catch (err) {
            debug_1.debug(err.message);
            return false;
        }
        debug_1.debug('saved type cache');
        return true;
    }
    reset() {
        try {
            this.values = {};
            this.fsLib.unlinkSync(this.cacheFile);
        }
        catch (err) {
            debug_1.debug(err.message);
            return false;
        }
        debug_1.debug('type cache reset');
        return true;
    }
    hasChanged() {
        return this.changed;
    }
    hasType(filename) {
        return !!this.values[filename];
    }
    hasProxiableType(filename) {
        const type = this.values[filename];
        return type === 'function' || type === 'object';
    }
    getType(filename) {
        return this.values[filename];
    }
    getTargetForProxiableType(filename) {
        const type = this.getType(filename);
        switch (type) {
            // MUST return a function expression, not an arrow function
            case 'function': return function () { }; // tslint:disable-line:only-arrow-functions
            case 'object': return {};
            default: throw new NamedError_1.NamedError('LazyModuleProxyTypeError', `Unexpected module proxy target type: ${type}`);
        }
    }
    setType(filename, type) {
        if (this.values[filename] === type) {
            return false;
        }
        else if (this.values[filename]) {
            debug_1.trace('module type change: %s from %s to %s', filename, this.values[filename], type);
        }
        this.values[filename] = type;
        this.changed = true;
        return true;
    }
    clearType(filename) {
        if (this.values[filename]) {
            delete this.values[filename];
            this.changed = true;
            return true;
        }
        return false;
    }
}
exports.default = TypeCache;
//# sourceMappingURL=TypeCache.js.map