"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isLocal = () => {
    return process.cwd() !== '/app';
};
exports.isLocal = isLocal;
