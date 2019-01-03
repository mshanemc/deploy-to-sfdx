"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const poolBuild_1 = require("./poolBuild");
poolBuild_1.poolBuild()
    .then((builtAnOrg) => {
    process.exit(0);
});
