"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
class Env {
    constructor(env = process.env) {
        this.env = env;
        this.env = env;
    }
    get(key, def) {
        return this.env[key] || def;
    }
    getBoolean(key, def) {
        return this.get(key, (!!def).toString()).toLowerCase() === 'true';
    }
    set(key, val) {
        if (lodash_1.isNil(val)) {
            this.delete(key);
        }
        this.env[key] = val;
    }
    setBoolean(key, val) {
        this.set(key, val.toString());
    }
    delete(key) {
        return delete this.env[key];
    }
}
exports.Env = Env;
exports.default = new Env();
//# sourceMappingURL=env.js.map