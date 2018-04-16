"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_command_1 = require("cli-engine-command");
const analytics_1 = require("../analytics");
class AnalyticsGet extends cli_engine_command_1.Command {
    async run(a, b, c) {
        this.out.log(JSON.stringify(await new analytics_1.default(this.config).readJSON()));
    }
}
exports.default = AnalyticsGet;
//# sourceMappingURL=analytics.js.map