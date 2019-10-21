"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const amIlocal_1 = require("./amIlocal");
const execProm_1 = require("./execProm");
const getKeypath = async () => {
    if (amIlocal_1.isLocal()) {
        if (process.env.LOCAL_ONLY_KEY_PATH) {
            return process.env.LOCAL_ONLY_KEY_PATH;
        }
        else {
            heroku_logger_1.default.error(`isLocal, but no local keypath. ${process.env.LOCAL_ONLY_KEY_PATH}`);
        }
    }
    else {
        if (!fs.existsSync('/app/tmp/server.key')) {
            fs.writeFileSync('/app/tmp/server.key', process.env.JWTKEY, 'utf8');
        }
        return '/app/tmp/server.key';
    }
};
exports.getKeypath = getKeypath;
const auth = async () => {
    const keypath = await getKeypath();
    try {
        if (!amIlocal_1.isLocal()) {
            heroku_logger_1.default.debug('hubAuth: updating plugin');
            await execProm_1.exec('sfdx plugins:link node_modules/shane-sfdx-plugins');
            await execProm_1.exec(`echo 'y' | sfdx plugins:install sfdx-migration-automatic@1.4.2`);
        }
        if (process.env.SFDX_PRERELEASE) {
            heroku_logger_1.default.debug('hubAuth: installing pre-release plugin for sfdx');
            await execProm_1.exec('sfdx plugins:install salesforcedx@pre-release');
        }
        if (process.env.HEROKU_API_KEY) {
            await execProm_1.exec('heroku update');
        }
        await execProm_1.exec(`sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${process.env.HUB_USERNAME} --jwtkeyfile ${await keypath} --setdefaultdevhubusername -a hub --json`);
    }
    catch (err) {
        heroku_logger_1.default.error('hubAuth', err);
        process.exit(1);
    }
    heroku_logger_1.default.debug('hubAuth: complete');
    return keypath;
};
exports.auth = auth;
