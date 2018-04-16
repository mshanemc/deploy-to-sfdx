"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_1 = require("cli-engine/lib/commands/update");
const NamedError_1 = require("../util/NamedError");
const Request = require("request");
const Debug = require("debug");
const debug = Debug('sfdx:update');
class Update extends update_1.default {
    constructor(options, env = process.env, request = Request) {
        super(options);
        this.env = env;
        this.request = request;
    }
    async run() {
        if (!this.config.updateDisabled) {
            let s3Host = this.env.SFDX_S3_HOST;
            if (s3Host) {
                // Warn that the updater is targeting something other than the public update site
                const message = 'Updating from SFDX_S3_HOST override. Are you on SFM?';
                this.out.warn(message);
            }
            s3Host = s3Host || (this.config.s3 || {}).host;
            if (!s3Host) {
                throw new NamedError_1.NamedError('S3HostNotFoundError', 'No S3 host defined');
            }
            await this.isS3HostReachable(s3Host);
        }
        await this.doUpdate();
    }
    async doUpdate() {
        debug('Invoking cli-engine update');
        await super.run();
    }
    async isS3HostReachable(s3Host, attempt = 1) {
        const MAX_ATTEMPTS = 3;
        const RETRY_MILLIS = 1000;
        if (attempt > MAX_ATTEMPTS) {
            throw new NamedError_1.NamedError('S3HostReachabilityError', 'S3 host is not reachable.');
        }
        if (attempt === 1) {
            debug('Testing S3 host reachability... (attempt %s)', attempt);
        }
        else {
            debug('Re-testing S3 host reachability in %s milliseconds...', RETRY_MILLIS);
            await this.sleep(RETRY_MILLIS);
        }
        if (attempt === 2) {
            this.out.warn('Attempting to contact update site...');
        }
        if (await this.isReachable(s3Host)) {
            if (attempt >= 2) {
                this.out.warn('Connected.');
            }
            debug('S3 host is reachable (attempt %s)', attempt);
            return true;
        }
        return await this.isS3HostReachable(s3Host, attempt + 1);
    }
    async isReachable(s3Host) {
        let url = s3Host;
        if (!/^https?:\/\//.test(url)) {
            url = 'https://' + url;
        }
        if (!url.endsWith('/')) {
            url += '/';
        }
        url += 'manifest.json';
        debug('Trying to reach S3 host at %s...', url);
        try {
            await this.ping(url);
            debug('Ping succeeded');
            return true;
        }
        catch (err) {
            debug('Ping failed', err);
            return false;
        }
    }
    async ping(url) {
        return await new Promise((resolve, reject) => {
            this.request.get({ url, timeout: 4000 }, (err, res) => {
                if (err) {
                    return reject(err);
                }
                if (res.statusCode !== 200) {
                    return reject(new NamedError_1.NamedError('HttpGetUnexpectedStatusError', `Unexpected GET response status ${res.statusCode}`));
                }
                return resolve();
            });
        });
    }
    async sleep(millis) {
        await new Promise((resolve) => setTimeout(resolve, millis));
    }
}
exports.default = Update;
//# sourceMappingURL=update.js.map