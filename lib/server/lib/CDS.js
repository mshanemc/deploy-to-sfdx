"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CDS {
    constructor(options) {
        this.deployId = options.deployId;
        this.complete = options.complete || false;
        this.completeTimestamp = options.completeTimestamp;
        this.browserStartTime = options.browserStartTime = new Date();
        this.openTimestamp = options.openTimestamp;
        this.poolBuildFinishTime = options.poolBuildFinishTime;
        this.poolBuildStartTime = options.poolBuildStartTime;
        this.buildStartTime = options.buildStartTime || new Date();
        this.lineCount = options.lineCount || 50;
        this.orgId = options.orgId;
        this.instanceUrl = options.instanceUrl;
        this.mainUser = options.mainUser || {};
        this.expirationDate = options.expirationDate;
        this.additionalUsers = options.additionalUsers || [];
        this.errors = options.errors || [];
        this.commandResults = options.commandResults || [];
        this.herokuResults = options.herokuResults || [];
        this.currentCommand = options.currentCommand;
        this.poolLines = options.poolLines;
        this.isPool = options.isPool || false;
    }
}
exports.CDS = CDS;
var commandSummary;
(function (commandSummary) {
    commandSummary["HEROKU_DEPLOY"] = "deploying a heroku app";
    commandSummary["OPEN"] = "opening org";
    commandSummary["PASSWORD_GEN"] = "generating a password";
    commandSummary["ORG_CREATE"] = "creating an org";
    commandSummary["PUSH"] = "pushing source";
    commandSummary["APEX_EXEC"] = "executing some apex";
    commandSummary["PERMSET"] = "assigning a permset";
    commandSummary["DATA"] = "loading some data";
    commandSummary["USER_CREATE"] = "creating a user";
    commandSummary["PACKAGE"] = "installing a package";
    commandSummary["DEPLOY"] = "deploying via metadata api";
})(commandSummary = exports.commandSummary || (exports.commandSummary = {}));
