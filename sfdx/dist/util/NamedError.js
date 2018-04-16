"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NamedError extends Error {
    constructor(name, message) {
        super(message);
        this._name = name;
    }
    get name() {
        return this._name;
    }
    get reason() {
        return this._reason;
    }
    set reason(value) {
        this._reason = value;
    }
    setReason(value) {
        this._reason = value;
        return this;
    }
    setReasonByMessage(value) {
        this._reason = new Error(value);
        return this;
    }
}
exports.NamedError = NamedError;
class InvalidUrlError extends NamedError {
    constructor(url) {
        super('InvalidUrl', `The following url is not valid ${url}`);
    }
}
exports.InvalidUrlError = InvalidUrlError;
class MissingRequiredParameter extends NamedError {
    constructor(parameterName) {
        super('MissingRequiredParameter', `The parameter ${parameterName} is missing but required.`);
    }
}
exports.MissingRequiredParameter = MissingRequiredParameter;
class ExecProcessFailed extends NamedError {
    constructor(process, errorCode) {
        super('Sub-process failed.', `Exec'd subprocess ${process} failed with error code: ${errorCode}`);
    }
}
exports.ExecProcessFailed = ExecProcessFailed;
class UnexpectedHost extends NamedError {
    constructor(url) {
        super('UnexpectedHost', `The host is not allowed to provide signing information. [${url}]`);
    }
}
exports.UnexpectedHost = UnexpectedHost;
class UnauthorizedSslConnection extends NamedError {
    constructor(url) {
        const message = `An attempt is being made to retrieve content from an unauthorized ssl url [${url}].
This endpoint could be using a self signed certificate.
To allow this set the following environment variable: NODE_TLS_REJECT_UNAUTHORIZED=0`;
        super('UnauthorizedSslConnection', message);
    }
}
exports.UnauthorizedSslConnection = UnauthorizedSslConnection;
class SignSignedCertError extends NamedError {
    constructor() {
        super('SelfSignedCert', 'Encountered a self signed certificated. To enable "export NODE_TLS_REJECT_UNAUTHORIZED=0"');
    }
}
exports.SignSignedCertError = SignSignedCertError;
//# sourceMappingURL=NamedError.js.map