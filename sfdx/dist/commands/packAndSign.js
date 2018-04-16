"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cli_engine_command_1 = require("cli-engine-command");
const packAndSign_1 = require("../codeSigning/packAndSign");
/**
 * Help message for the command.
 * Help doesn't currently work for builtin commands this is here in case it ever does.
 */
// Build function that will perform four things:
// 1) update the npm cert and signature home url in package.json
// 2) pack the npm into a tar gz file
// 3) sign the tar gz file using the private key associated with the cert.
// 4) test verify the signature
// Required Parameters:
// --signatureUrl - the url where the signature will be hosted minus the name of the signature file.
// --publicKeyUrl - the url where the public key/certificate will be hosted.
// --privateKeyPath - the local file path for the private key.
// Returns:
// A tar.gz and signature file. The signature file will match the name of the tar gz except the extension will be ".sig".
// This file must be hosted at the location specified by --signature.
// Usage:
// sfdx packAndSign --signature http://foo.salesforce.internal.com/file/location --publicKeyUrl http://foo.salesforce.internal.com/file/location/sfdx.cert --privateKeyPath $HOME/sfdx.key
class PackAndSign extends cli_engine_command_1.Command {
    async run() {
        await packAndSign_1.api.doPackAndSign(this.flags);
    }
}
PackAndSign.topic = 'packAndSign';
PackAndSign.description = 'pack an npm package and produce a tgz file along with a corresponding digital signature';
PackAndSign.flags = {
    signatureUrl: cli_engine_command_1.flags.string({
        char: 's',
        required: true,
        description: 'the url location where the signature will be hosted minus the name of the actual signature file.'
    }),
    publicKeyUrl: cli_engine_command_1.flags.string({
        char: 'p',
        required: true,
        description: 'the url where the public key/certificate will be hosted.'
    }),
    privateKeyPath: cli_engine_command_1.flags.string({
        char: 'k',
        required: true,
        description: 'the local file path for the private key.'
    })
};
exports.default = PackAndSign;
//# sourceMappingURL=packAndSign.js.map