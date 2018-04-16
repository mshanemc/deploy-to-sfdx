"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_command_1 = require("cli-engine-command");
const analytics_1 = require("../../analytics");
class AnalyticsClear extends cli_engine_command_1.Command {
    async run(a, b, c) {
        await new analytics_1.default(this.config).clear();
    }
}
exports.default = AnalyticsClear;
//# sourceMappingURL=clear.js.map