"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const _ = require("lodash");
const NamedError_1 = require("../util/NamedError");
const url_1 = require("url");
const CRYPTO_LEVEL = 'RSA-SHA256';
const SALESFORCE_URL_PATTERNS = [/developer\.salesforce\.com/];
if (process.env.SFDX_ALLOW_ALL_SALESFORCE_CERTSIG_HOSTING === 'true') {
    SALESFORCE_URL_PATTERNS.push(/(.salesforce.com)$/);
}
// This is the fingerprint for https://developer.salesforce.com
exports.SALESFORCE_CERT_FINGERPRINT = process.env.SFDX_DEVELOPER_TRUSTED_FINGERPRINT ||
    '5E:E3:12:97:09:3E:60:11:50:9A:B2:A7:5B:49:B9:78:C4:7B:4B:D9';
function validSalesforceHostname(url) {
    if (!url) {
        return false;
    }
    const parsedUrl = url_1.parse(url);
    if (process.env.SFDX_ALLOW_ALL_SALESFORCE_CERTSIG_HOSTING === 'true') {
        return parsedUrl.hostname && /(\.salesforce\.com)$/.test(parsedUrl.hostname);
    }
    else {
        return parsedUrl.protocol === 'https:' && parsedUrl.hostname && parsedUrl.hostname === 'developer.salesforce.com';
    }
}
exports.validSalesforceHostname = validSalesforceHostname;
function validateRequestCert(request) {
    if (!(process.env.SFDX_DISABLE_CERT_PINNING === 'true')) {
        request.on('socket', (socket) => {
            socket.on('secureConnect', () => {
                const fingerprint = socket.getPeerCertificate().fingerprint;
                // If NODE_TLS_REJECT_UNAUTHORIZED is disabled this code can still enforce authorization.
                // If we ever get asked by security to prevent disabling auth (essentially not support self signed certs) - then
                // this is the code for it. So keep this code around.
                // if (!socket.authorized) {
                // throw new NamedError('CertificateNotAuthorized',
                //    `The certificate for ${url} is not valid: ${socket.authorizationError}`);
                // }
                if (!_.includes(exports.SALESFORCE_CERT_FINGERPRINT, fingerprint)) {
                    throw new NamedError_1.NamedError('CertificateFingerprintNotMatch', `The expected fingerprint and the fingerprint [${fingerprint}] from the certificate found at https://developer.salesforce.com do not match.`);
                }
            });
        });
    }
}
exports.validateRequestCert = validateRequestCert;
class CodeSignInfo {
    set dataToSignStream(stream) {
        this._dataToSignStream = stream;
    }
    get dataToSignStream() {
        return this._dataToSignStream;
    }
    set privateKeyStream(stream) {
        this._privateKeyStream = stream;
    }
    get privateKeyStream() {
        return this._privateKeyStream;
    }
}
exports.CodeSignInfo = CodeSignInfo;
class CodeVerifierInfo {
    get dataToVerify() {
        return this._dataToVerify;
    }
    set dataToVerify(value) {
        this._dataToVerify = value;
    }
    get signatureStream() {
        return this._signatureStream;
    }
    set signatureStream(value) {
        this._signatureStream = value;
    }
    get publicKeyStream() {
        return this._publicKeyStream;
    }
    set publicKeyStream(value) {
        this._publicKeyStream = value;
    }
}
exports.CodeVerifierInfo = CodeVerifierInfo;
function retrieveKey(stream) {
    return new Promise((resolve, reject) => {
        let key = '';
        if (stream) {
            stream.on('data', (chunk) => {
                key += chunk;
            });
            stream.on('end', () => {
                if (!_.startsWith(key, '-----BEGIN')) {
                    return reject(new NamedError_1.NamedError('InvalidKeyFormat', 'The specified key format is invalid.'));
                }
                return resolve(key);
            });
            stream.on('error', (err) => {
                return reject(err);
            });
        }
    });
}
async function sign(codeSignInfo) {
    const privateKey = await retrieveKey(codeSignInfo.privateKeyStream);
    const signApi = crypto.createSign(CRYPTO_LEVEL);
    return new Promise((resolve, reject) => {
        codeSignInfo.dataToSignStream.pipe(signApi);
        codeSignInfo.dataToSignStream.on('end', () => {
            return resolve(signApi.sign(privateKey, 'base64'));
        });
        codeSignInfo.dataToSignStream.on('error', (err) => {
            return reject(err);
        });
    });
}
exports.default = sign;
async function verify(codeVerifierInfo) {
    const publicKey = await retrieveKey(codeVerifierInfo.publicKeyStream);
    const signApi = crypto.createVerify(CRYPTO_LEVEL);
    return new Promise((resolve, reject) => {
        codeVerifierInfo.dataToVerify.pipe(signApi);
        codeVerifierInfo.dataToVerify.on('end', () => {
            // The sign signature returns a base64 encode string.
            let signature = Buffer.alloc(0);
            codeVerifierInfo.signatureStream.on('data', (chunk) => {
                signature = Buffer.concat([signature, chunk]);
            });
            codeVerifierInfo.signatureStream.on('end', () => {
                if (signature.byteLength === 0) {
                    return reject(new NamedError_1.NamedError('InvalidSignature', 'The provided signature is invalid or missing.'));
                }
                else {
                    const verification = signApi.verify(publicKey, signature.toString('utf8'), 'base64');
                    return resolve(verification);
                }
            });
            codeVerifierInfo.signatureStream.on('error', (err) => {
                return reject(err);
            });
        });
        codeVerifierInfo.dataToVerify.on('error', (err) => {
            return reject(err);
        });
    });
}
exports.verify = verify;
//# sourceMappingURL=codeSignApi.js.map