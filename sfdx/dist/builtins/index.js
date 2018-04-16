"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_1 = require("./update");
exports.commands = [
    update_1.default
];
exports.topics = exports.commands.map((cmd) => {
    return {
        topic: cmd.topic,
        command: cmd.command,
        description: cmd.description
    };
});
//# sourceMappingURL=index.js.map