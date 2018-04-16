#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const os_1 = require("os");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const path_2 = require("path");
const cli_ux_1 = require("cli-ux");
const _ = require("lodash");
const request = require("request");
const NamedError_1 = require("../util/NamedError");
const codeSignApi_1 = require("../codeSigning/codeSignApi");
const util_1 = require("util");
const readFileAsync = util_1.promisify(fs_extra_1.readFile);
const writeFileAsync = util_1.promisify(fs_extra_1.writeFile);
const removeFileAsync = util_1.promisify(fs_extra_1.remove);
const copyFileAsync = util_1.promisify(fs_extra_1.copy);
const PACKAGE_DOT_JSON = 'package.json';
const PACKAGE_DOT_JSON_PATH = path_1.join(process.cwd(), PACKAGE_DOT_JSON);
const PACKAGE_DOT_JSON_PATH_BAK = path_1.join(process.cwd(), `${PACKAGE_DOT_JSON}.bak`);
const cliUx = new cli_ux_1.CLI();
exports.api = {
    /**
     * Validates that a url is a valid salesforce url.
     * @param url - The url to validate.
     */
    validateUrl(url) {
        try {
            // new URL throws if a host cannot be parsed out.
            if (!codeSignApi_1.validSalesforceHostname(url)) {
                throw new NamedError_1.NamedError('NotASalesforceHost', 'Signing urls must have the hostname developer.salesforce.com and be https');
            }
        }
        catch (e) {
            const err = new NamedError_1.InvalidUrlError(url);
            err.reason = e;
            throw err;
        }
    },
    /**
     * call out to npm pack;
     */
    pack() {
        return new Promise((resolve, reject) => {
            const command = 'npm pack -p -s';
            child_process_1.exec(command, (error, stdout, stderr) => {
                if (error && error.code) {
                    const err = new NamedError_1.ExecProcessFailed(command, error.code).setReasonByMessage(stderr);
                    return reject(err);
                }
                else {
                    const output = stdout.split(os_1.EOL);
                    if (output.length > 1) {
                        // note the output end with a newline;
                        const path = output[output.length - 2];
                        if (path && path.endsWith('tgz')) {
                            return resolve(path);
                        }
                        else {
                            return reject(new NamedError_1.NamedError('UnexpectedNpmFormat', `Npm pack did not return an expected tgz filename result: [${path}]`));
                        }
                    }
                    else {
                        return reject(new NamedError_1.NamedError('UnexpectedNpmFormat', `The output from the npm utility is unexpected [${stdout}]`));
                    }
                }
            });
        });
    },
    /**
     * verify a signature against a public key and tgz content
     * @param tarGzStream - Tar file to validate
     * @param sigFilenameStream - Computed signature
     * @param publicKeyUrl - url for the public key
     */
    verify(tarGzStream, sigFilenameStream, publicKeyUrl) {
        return new Promise((resolve, reject) => {
            const verifyInfo = new codeSignApi_1.CodeVerifierInfo();
            verifyInfo.dataToVerify = tarGzStream;
            verifyInfo.signatureStream = sigFilenameStream;
            const req = request.get(publicKeyUrl);
            codeSignApi_1.validateRequestCert(req);
            req.on('response', (response) => {
                if (response && response.statusCode === 200) {
                    verifyInfo.publicKeyStream = response;
                    return resolve(codeSignApi_1.verify(verifyInfo));
                }
                else {
                    return reject(new NamedError_1.NamedError('RetrievePublicKeyFailed', `Couldn't retrieve public key at url: ${publicKeyUrl} error code: ${response.statusCode}`));
                }
            });
            req.on('error', (err) => {
                if (err && err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                    reject(new NamedError_1.SignSignedCertError());
                }
                else {
                    reject(err);
                }
            });
        });
    },
    /**
     * sign a tgz file stream
     * @param fileStream - the tgz file stream to sign
     * @param privateKeyStream - the certificate's private key
     */
    retrieveSignature(fileStream, privateKeyStream) {
        const info = new codeSignApi_1.CodeSignInfo();
        info.dataToSignStream = fileStream;
        info.privateKeyStream = privateKeyStream;
        return codeSignApi_1.default(info);
    },
    /**
     * write the signature to a '.sig' file. this file is to be deployed to signatureUrl
     * @param filePath - the file path to the tgz file
     * @param signature - the computed signature
     */
    async writeSignatureFile(filePath, signature) {
        if (!_.endsWith(filePath, 'tgz')) {
            throw new NamedError_1.NamedError('UnexpectedTgzName', `The file path ${filePath} is unexpected. It should be a tgz file.`);
        }
        cliUx.log(`Signing file at: ${filePath}`);
        const pathComponents = _.split(filePath, path_2.sep);
        const filenamePart = _.last(pathComponents);
        const sigFilename = _.replace(filenamePart, '.tgz', '.sig');
        await writeFileAsync(path_1.join(process.cwd(), sigFilename), signature);
        return sigFilename;
    },
    /**
     * read the package.json file for the target npm to be signed.
     */
    retrievePackageJson() {
        return readFileAsync(PACKAGE_DOT_JSON_PATH, { encoding: 'utf8' });
    },
    /**
     * read the npm ignore file for the target npm
     * @param filename - local path to the npmignore file
     */
    retrieveIgnoreFile(filename) {
        return readFileAsync(path_1.join(process.cwd(), filename), { encoding: 'utf8' });
    },
    /**
     * checks the ignore content for the code signing patterns. *.tgz, *.sig package.json.bak
     * @param content
     */
    validateNpmIgnorePatterns(content) {
        const validate = (pattern) => {
            if (!content) {
                throw new NamedError_1.NamedError('MissingNpmIgnoreFile', 'Missing .npmignore file. The following patterns are required in for code signing: *.tgz, *.sig, package.json.bak.');
            }
            if (!_.includes(content, pattern)) {
                throw new NamedError_1.NamedError('MissingNpmIgnorePattern', `.npmignore is missing ${pattern}. The following patterns are required for code signing: *.tgz, *.sig, package.json.bak`);
            }
        };
        validate('*.tgz');
        validate('*.sig');
        validate('package.json.bak');
    },
    /**
     * makes a backup copy pf package.json
     * @param src - the package.json to backup
     * @param dest - package.json.bak
     */
    copyPackageDotJson(src, dest) {
        return copyFileAsync(src, dest);
    },
    /**
     * used to update the contents of package.json
     * @param pJson - the updated json content to write to disk
     */
    writePackageJson(pJson) {
        return writeFileAsync(PACKAGE_DOT_JSON_PATH, JSON.stringify(pJson, null, 4));
    },
    /**
     * main method to pack and sign an npm.
     * @param args - reference to process.argv
     */
    async doPackAndSign(args) {
        let packageDotJsonBackedUp = false;
        let error;
        try {
            exports.api.validateUrl(args.signatureUrl);
            exports.api.validateUrl(args.publicKeyUrl);
            // validate npm ignore has what we name.
            let filename = '.npmignore';
            const npmIgnoreContent = await exports.api.retrieveIgnoreFile(filename);
            exports.api.validateNpmIgnorePatterns(npmIgnoreContent);
            // Recommend updating git ignore to match npmignore.
            filename = '.gitignore';
            const gitIgnoreContent = await exports.api.retrieveIgnoreFile(filename);
            try {
                exports.api.validateNpmIgnorePatterns(gitIgnoreContent);
            }
            catch (e) {
                cliUx.warn(`WARNING:  The following patterns are recommended in ${filename} for code signing: *.tgz, *.sig, package.json.bak.`);
            }
            // read package.json info
            const packageJsonContent = await exports.api.retrievePackageJson();
            let packageJson = JSON.parse(packageJsonContent);
            // compute the name of the signature file
            const sigFilename = `${packageJson.name}-${packageJson.version}.sig`;
            // make a backup of the signature file
            await exports.api.copyPackageDotJson(PACKAGE_DOT_JSON_PATH, PACKAGE_DOT_JSON_PATH_BAK);
            packageDotJsonBackedUp = true;
            cliUx.log(`Backed up ${PACKAGE_DOT_JSON_PATH} to ${PACKAGE_DOT_JSON_PATH_BAK}`);
            // update the package.json object with the signature urls and write it to disk.
            const sigUrl = `${args.signatureUrl}${_.endsWith(args.signatureUrl, '/') ? '' : '/'}${sigFilename}`;
            packageJson = _.merge(packageJson, { sfdx: { publicKeyUrl: args.publicKeyUrl, signatureUrl: `${sigUrl}` } });
            await exports.api.writePackageJson(packageJson);
            cliUx.log('Successfully updated package.json with public key and signature file locations.');
            const filepath = await exports.api.pack();
            // create the signature file
            const signature = await exports.api.retrieveSignature(fs_extra_1.createReadStream(filepath, { encoding: 'binary' }), fs_extra_1.createReadStream(args.privateKeyPath));
            if (signature && signature.length > 0) {
                // write the signature file to disk
                await exports.api.writeSignatureFile(filepath, signature);
                cliUx.log(`Artifact signed and saved in ${sigFilename}`);
                let verified;
                try {
                    // verify the signature with the public key url
                    verified = await exports.api.verify(fs_extra_1.createReadStream(filepath, { encoding: 'binary' }), fs_extra_1.createReadStream(path_1.join(process.cwd(), sigFilename)), args.publicKeyUrl);
                }
                catch (e) {
                    const e1 = new NamedError_1.NamedError('VerificationError', 'An error occurred trying to validate the signature. Check the public key url and try again.');
                    e1.reason = e;
                    throw e1;
                }
                if (verified) {
                    cliUx.log(`Successfully verified signature with public key at: ${args.publicKeyUrl}`);
                    return verified;
                }
                else {
                    throw new NamedError_1.NamedError('FailedToVerifySignature', 'Failed to verify signature with tar gz content');
                }
            }
            else {
                throw new NamedError_1.NamedError('EmptySignature', 'The generated signature is empty. Verify the private key and try again');
            }
        }
        catch (e) {
            error = e;
        }
        finally {
            // Restore the package.json file so it doesn't show a git diff.
            if (packageDotJsonBackedUp) {
                cliUx.log('Restoring package.json');
                await exports.api.copyPackageDotJson(PACKAGE_DOT_JSON_PATH_BAK, PACKAGE_DOT_JSON_PATH);
                await removeFileAsync(PACKAGE_DOT_JSON_PATH_BAK);
            }
            if (error) {
                if (error.reason) {
                    cliUx.error(`ERROR: ${error.message} REASON: ${error.reason.message}`);
                }
                else {
                    cliUx.error(`ERROR: ${error.message}`);
                }
                process.exitCode = 1;
            }
        }
    }
};
//# sourceMappingURL=packAndSign.js.map