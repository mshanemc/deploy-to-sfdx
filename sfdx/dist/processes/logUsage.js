"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const analytics_1 = require("../analytics");
try {
    const { config, plugin, commandId, time, status } = JSON.parse(process.argv[2]);
    /* tslint:disable-next-line no-floating-promises */
    new analytics_1.default(config).record(plugin, commandId, time, status);
}
catch (err) {
    // Do nothing. This prevents throwing an error on the
    // upgrade path. Can remove after all clients are off 6.0.10
}
//# sourceMappingURL=logUsage.js.map