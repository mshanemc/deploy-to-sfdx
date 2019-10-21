"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const strip_color_1 = __importDefault(require("strip-color"));
const attempt_1 = require("@lifeomic/attempt");
const utilities_1 = require("./utilities");
const redisNormal_1 = require("./redisNormal");
const hubAuth_1 = require("./hubAuth");
const argStripper_1 = require("./argStripper");
const timeTracking_1 = require("./timeTracking");
const execProm_1 = require("./execProm");
const retryOptions = { maxAttempts: 60, delay: 5000 };
const pooledOrgFinder = async function (deployReq, forcePool = false) {
    try {
        if (!process.env.POOLCONFIG_URL && !forcePool) {
            return;
        }
        let cds = await redisNormal_1.getPooledOrg(await utilities_1.utilities.getKey(deployReq), true);
        cds = {
            ...cds,
            buildStartTime: new Date(),
            deployId: deployReq.deployId,
            browserStartTime: deployReq.createdTimestamp || new Date(),
            complete: false,
            isPool: false
        };
        await redisNormal_1.cdsPublish(cds);
        const uniquePath = path.join(__dirname, '../tmp/pools', cds.orgId);
        fs_extra_1.default.ensureDirSync(uniquePath);
        const jwtComand = `sfdx force:auth:jwt:grant --clientid ${process.env.CONSUMERKEY} --username ${cds.mainUser.username} --jwtkeyfile ${await hubAuth_1.getKeypath()} --instanceurl https://test.salesforce.com -s`;
        if (forcePool) {
            await attempt_1.retry(async (context) => execProm_1.execProm(jwtComand, { cwd: uniquePath }), retryOptions);
        }
        else {
            await execProm_1.execProm(jwtComand, { cwd: uniquePath });
        }
        if (deployReq.email) {
            heroku_logger_1.default.debug(`changing email to ${deployReq.email}`);
            await execProm_1.execProm(`sfdx force:data:record:update -s User -w "username='${cds.mainUser.username}'" -v "email='${deployReq.email}'"`, {
                cwd: uniquePath
            });
        }
        let password;
        if (cds.poolLines.passwordLine) {
            const stripped = argStripper_1.argStripper(cds.poolLines.passwordLine, '--json', true);
            const passwordSetResult = await execProm_1.execProm(`${stripped} --json`, {
                cwd: uniquePath
            });
            if (passwordSetResult) {
                password = JSON.parse(strip_color_1.default(passwordSetResult.stdout)).result.password;
                heroku_logger_1.default.debug(`password set to: ${password}`);
            }
        }
        const openResult = await execProm_1.execProm(`${cds.poolLines.openLine} --json -r`, {
            cwd: uniquePath
        });
        const openOutput = JSON.parse(strip_color_1.default(openResult.stdout));
        cds.openTimestamp = new Date();
        cds.completeTimestamp = new Date();
        cds.mainUser = {
            ...cds.mainUser,
            loginUrl: utilities_1.utilities.urlFix(openOutput).result.url,
            password
        };
        cds.complete = true;
        heroku_logger_1.default.debug(`opened : ${openOutput}`);
        await redisNormal_1.cdsPublish(cds);
        timeTracking_1.timesToGA(deployReq, cds);
        return cds;
    }
    catch (e) {
        heroku_logger_1.default.warn('pooledOrgFinder');
        heroku_logger_1.default.warn(e);
        return null;
    }
};
exports.pooledOrgFinder = pooledOrgFinder;
