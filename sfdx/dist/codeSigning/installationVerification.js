"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const url_1 = require("url");
const _ = require("lodash");
const request = require("request");
const stream_1 = require("stream");
const util_1 = require("util");
const codeSignApi_1 = require("./codeSignApi");
const NamedError_1 = require("../util/NamedError");
exports.WHITELIST_FILENAME = 'unsignedPluginWhiteList.json';
exports.DEFAULT_REGISTRY = 'https://registry.npmjs.org/';
exports.getNpmRegistry = () => {
    return new url_1.URL(process.env.SFDX_NPM_REGISTRY || exports.DEFAULT_REGISTRY);
};
/**
 * simple data structure representing the discovered meta information needed for signing,
 */
class NpmMeta {
}
exports.NpmMeta = NpmMeta;
/**
 * class for verifying a digital signature pack of an npm
 */
class InstallationVerification {
    constructor(requestImpl, fsImpl) {
        // why? dependency injection is better than sinon
        this.requestImpl = requestImpl ? requestImpl : request;
        this.fsImpl = fsImpl ? fsImpl : fs;
        this.readFileAsync = util_1.promisify(this.fsImpl.readFile);
        this.pluginTag = 'latest';
    }
    /**
     * setter for the cli engine config
     * @param _config cli engine config
     */
    setCliEngineConfig(_config) {
        if (_config) {
            this.config = _config;
            return this;
        }
        throw new NamedError_1.NamedError('InvalidParam', 'the cli engine config cannot be null');
    }
    /**
     * setter for the plugin name
     * @param _pluginName the published plugin name
     */
    setPluginName(_pluginName) {
        if (_pluginName) {
            this.pluginName = _pluginName;
            return this;
        }
        throw new NamedError_1.NamedError('InvalidParam', 'pluginName cannot be nll');
    }
    /**
     * Setter for the plugin tad. If falsy the tag will be latest.
     * @param _tagName Setter for the plugin tag
     */
    setPluginTag(_tagName) {
        if (_tagName) {
            this.pluginTag = _tagName;
        }
        return this;
    }
    /**
     * return the plugins tag name. 'latest' is returned by default
     */
    getPluginTag() {
        return this.pluginTag;
    }
    /**
     * validates the digital signature.
     */
    async verify() {
        const npmMeta = await this.streamTagGz();
        const info = new codeSignApi_1.CodeVerifierInfo();
        info.dataToVerify = this.fsImpl.createReadStream(npmMeta.tarballLocalPath, { encoding: 'binary' });
        return Promise.all([
            this.getSigningContent(npmMeta.signatureUrl),
            this.getSigningContent(npmMeta.publicKeyUrl)
        ])
            .then((result) => {
            info.signatureStream = result[0];
            info.publicKeyStream = result[1];
            return codeSignApi_1.verify(info);
        })
            .then((result) => {
            npmMeta.verified = result;
            return npmMeta;
        })
            .catch((e) => {
            if (e.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
                throw new NamedError_1.SignSignedCertError();
            }
            throw e;
        });
    }
    async isWhiteListed() {
        const whitelistFilePath = path.join(this.getConfigPath(), exports.WHITELIST_FILENAME);
        try {
            const fileContent = await this.readFileAsync(whitelistFilePath);
            const whitelistArray = JSON.parse(fileContent);
            return whitelistArray && whitelistArray.includes(this.pluginName);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return false;
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Retrieve url content for a host
     * @param url host url.
     */
    getSigningContent(url) {
        return new Promise((resolve, reject) => {
            this.requestImpl(url, (err, response, responseData) => {
                if (err) {
                    return reject(err);
                }
                else {
                    if (response && response.statusCode === 200) {
                        // The verification api expects a readable
                        return resolve(new stream_1.Readable({
                            read() {
                                this.push(responseData);
                                this.push(null);
                            }
                        }));
                    }
                    else {
                        return reject(new NamedError_1.NamedError('ErrorGettingContent', `A request to url ${url} failed with error code: [${response ? response.statusCode : 'undefined'}]`));
                    }
                }
            });
        });
    }
    /**
     * Downloads the tgz file content and stores it in a cache folder
     */
    async streamTagGz() {
        const npmMeta = await this.retrieveNpmMeta();
        const urlObject = new url_1.URL(npmMeta.tarballUrl);
        const urlPathsAsArray = _.split(urlObject.pathname, '/');
        const fileNameStr = _.last(urlPathsAsArray);
        return new Promise((resolve, reject) => {
            const cacheFilePath = path.join(this.getCachePath(), fileNameStr);
            const writeStream = this.fsImpl.createWriteStream(cacheFilePath, { encoding: 'binary' });
            this.requestImpl(npmMeta.tarballUrl)
                .on('end', () => {
                npmMeta.tarballLocalPath = cacheFilePath;
                return resolve(npmMeta);
            })
                .on('error', (err) => {
                return reject(err);
            })
                .pipe(writeStream);
        });
    }
    // this is generally $HOME/.config/sfdx
    getConfigPath() {
        return _.get(this.config, 'configDir');
    }
    // this is generally $HOME/Library/Caches/sfdx on mac
    getCachePath() {
        return _.get(this.config, 'cacheDir');
    }
    /**
     * Invoke npm to discover a urls for the certificate and digital signature.
     */
    async retrieveNpmMeta() {
        return new Promise((resolve, reject) => {
            // console.log('@TODO - support proxies');
            // console.log('@TODO - https thumbprints');
            const npmRegistry = exports.getNpmRegistry();
            npmRegistry.pathname = this.pluginName;
            this.requestImpl(npmRegistry.href, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                if (response && response.statusCode === 200) {
                    const responseObj = JSON.parse(body);
                    // Make sure the response has a version attribute
                    if (!responseObj.versions) {
                        return reject(new NamedError_1.NamedError('InvalidNpmMetadata', `The npm metadata for plugin ${this.pluginName} is missing the versions attribute.`));
                    }
                    // Assume the tag is version tag.
                    let versionObject = _.get(responseObj.versions, this.pluginTag);
                    // If the assumption was not correct the tag must be a non-versioned dist-tag or not specified.
                    if (!versionObject) {
                        // Assume dist-tag;
                        const distTags = _.get(responseObj, 'dist-tags');
                        if (distTags) {
                            const tagVersionStr = _.get(distTags, this.pluginTag);
                            // if we got a dist tag hit look up the version object
                            if (tagVersionStr && tagVersionStr.length > 0 && _.includes(tagVersionStr, '.')) {
                                versionObject = _.get(responseObj.versions, tagVersionStr);
                            }
                            else {
                                return reject(new NamedError_1.NamedError('NpmTagNotFound', `The dist tag ${this.pluginTag} was not found for plugin: ${this.pluginName}`));
                            }
                        }
                        else {
                            return reject(new NamedError_1.NamedError('UnexpectedNpmFormat', 'The deployed NPM is missing dist-tags.'));
                        }
                    }
                    if (!(versionObject && versionObject.sfdx)) {
                        return reject(new NamedError_1.NamedError('NotSigned', 'This plugin is not signed by Salesforce.com ,Inc'));
                    }
                    else {
                        const meta = new NpmMeta();
                        if (!codeSignApi_1.validSalesforceHostname(versionObject.sfdx.publicKeyUrl)) {
                            return reject(new NamedError_1.UnexpectedHost(versionObject.sfdx.publicKeyUrl));
                        }
                        else {
                            meta.publicKeyUrl = versionObject.sfdx.publicKeyUrl;
                        }
                        if (!codeSignApi_1.validSalesforceHostname(versionObject.sfdx.signatureUrl)) {
                            return reject(new NamedError_1.UnexpectedHost(versionObject.sfdx.signatureUrl));
                        }
                        else {
                            meta.signatureUrl = versionObject.sfdx.signatureUrl;
                        }
                        meta.tarballUrl = versionObject.dist.tarball;
                        return resolve(meta);
                    }
                }
                else {
                    return reject(new NamedError_1.NamedError('UrlRetrieve', `The url request returned ${response.statusCode} - ${npmRegistry.href}`));
                }
            });
        });
    }
}
exports.InstallationVerification = InstallationVerification;
class VerificationConfig {
    get verifier() {
        return this._verifier;
    }
    set verifier(value) {
        this._verifier = value;
    }
    get log() {
        return this._log;
    }
    set log(value) {
        this._log = value;
    }
    get prompt() {
        return this._prompt;
    }
    set prompt(value) {
        this._prompt = value;
    }
}
exports.VerificationConfig = VerificationConfig;
async function doInstallationCodeSigningVerification(config, { plugin, tag }, verificationConfig) {
    try {
        const meta = await verificationConfig.verifier.verify();
        if (!meta.verified) {
            throw new NamedError_1.NamedError('FailedDigitalSignatureVerification', 'A digital signature is specified for this plugin but it didn\'t verify against the certificate.');
        }
        verificationConfig.log(`Successfully validated digital signature for ${plugin}.`);
    }
    catch (err) {
        if (err.name === 'NotSigned') {
            if (await verificationConfig.verifier.isWhiteListed()) {
                verificationConfig.log(`The plugin [${plugin}] is not digitally signed but it is white-listed.`);
                return;
            }
            else {
                const _continue = await verificationConfig.prompt('This plugin is not digitally signed and its authenticity cannot be verified. Continue installation y/n?');
                switch (_.toLower(_continue)) {
                    case 'y':
                        return;
                    default:
                        throw new NamedError_1.NamedError('CanceledByUser', 'The plugin installation has been cancel by the user.');
                }
            }
        }
        throw err;
    }
}
exports.doInstallationCodeSigningVerification = doInstallationCodeSigningVerification;
//# sourceMappingURL=installationVerification.js.map