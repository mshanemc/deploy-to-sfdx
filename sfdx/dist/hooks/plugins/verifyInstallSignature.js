"use strict";
const timedHook_1 = require("../timedHook");
const NamedError_1 = require("../../util/NamedError");
const installationVerification_1 = require("../../codeSigning/installationVerification");
const cli_ux_1 = require("cli-ux");
async function run(config, { plugin, tag }) {
    const cliUx = new cli_ux_1.CLI();
    cliUx.action.stop('Checking for digital signature.');
    const vConfig = new installationVerification_1.VerificationConfig();
    vConfig.verifier = new installationVerification_1.InstallationVerification()
        .setPluginName(plugin)
        .setPluginTag(tag)
        .setCliEngineConfig(config);
    vConfig.log = cliUx.log.bind(cliUx);
    vConfig.prompt = cliUx.prompt.bind(cliUx);
    let namedError;
    try {
        await installationVerification_1.doInstallationCodeSigningVerification(config, { plugin, tag }, vConfig);
    }
    catch (e) {
        if (e instanceof NamedError_1.NamedError) {
            namedError = e;
        }
        throw e;
    }
    finally {
        if (namedError) {
            cliUx.action.start('Finished digital signature check. Skipping');
        }
        else {
            cliUx.action.start('Finished digital signature check. Installing');
        }
    }
}
module.exports = timedHook_1.default('plugins:preinstall:signing', run);
//# sourceMappingURL=verifyInstallSignature.js.map