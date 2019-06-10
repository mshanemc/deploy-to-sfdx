"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util = require("util");
const execProm = util.promisify(child_process_1.exec);
exports.execProm = execProm;
exports.exec = execProm;
