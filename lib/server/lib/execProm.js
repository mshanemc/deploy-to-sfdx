"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const strip_color_1 = __importDefault(require("strip-color"));
const util = __importStar(require("util"));
const execProm = util.promisify(child_process_1.exec);
exports.execProm = execProm;
exports.exec = execProm;
const exec2JSON = async (cmd, options = {}) => {
    try {
        const results = await execProm(cmd, options);
        return JSON.parse(strip_color_1.default(results.stdout));
    }
    catch (err) {
        return JSON.parse(strip_color_1.default(err.stdout));
    }
};
exports.exec2JSON = exec2JSON;
const exec2String = async (cmd, options = {}) => {
    try {
        const results = await execProm(cmd, options);
        return results.stdout;
    }
    catch (err) {
        return err.stdout;
    }
};
exports.exec2String = exec2String;
