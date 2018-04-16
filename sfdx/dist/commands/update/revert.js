"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const cli_engine_command_1 = require("cli-engine-command");
const NamedError_1 = require("../../util/NamedError");
const cli_ux_1 = require("cli-ux");
class Revert extends cli_engine_command_1.Command {
    async run() {
        const ux = new cli_ux_1.CLI();
        const dataDir = this.config.dataDir;
        if (!dataDir) {
            throw new NamedError_1.NamedError('ConfigDataDirNotCountError', 'Config value dataDir not found');
        }
        const clientDir = path.join(dataDir, 'client');
        if (!fs.existsSync(clientDir)) {
            ux.log('Nothing to do -- already using the base installation of the CLI');
            return;
        }
        if (__dirname.startsWith(clientDir)) {
            ux.error('The update:revert command was not found in the base installation -- please re-install to use this command');
            return;
        }
        const response = await ux.prompt('Do you really wish to revert to the initially installed version of the CLI y/n?');
        if (response.toLowerCase() !== 'y') {
            return;
        }
        fs.removeSync(clientDir);
        ux.log('Removed updates from %s -- CLI restored to original installation', clientDir);
    }
}
Revert.description = 'restores the CLI to the originally installed version, removing updates';
exports.default = Revert;
//# sourceMappingURL=revert.js.map