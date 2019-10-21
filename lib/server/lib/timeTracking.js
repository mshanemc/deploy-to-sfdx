"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const timesToGA = (msgJSON, CDS) => {
    if (msgJSON.template) {
        try {
            msgJSON.visitor
                .timing('time in queue', msgJSON.template, (new Date(CDS.buildStartTime).getTime() - new Date(CDS.browserStartTime).getTime()).toString())
                .send();
            msgJSON.visitor
                .timing('time to build', msgJSON.template, (new Date(CDS.completeTimestamp).getTime() - new Date(CDS.buildStartTime).getTime()).toString())
                .send();
            msgJSON.visitor
                .timing('time until fully deployed', msgJSON.template, (new Date(CDS.completeTimestamp).getTime() - new Date(CDS.browserStartTime).getTime()).toString())
                .send();
            msgJSON.visitor
                .timing('time until open button appears', msgJSON.template, (new Date(CDS.openTimestamp).getTime() - new Date(CDS.browserStartTime).getTime()).toString())
                .send();
        }
        catch (e) {
            heroku_logger_1.default.warn('GA timestamps not firing', msgJSON);
            heroku_logger_1.default.warn('acutal GA error', e);
        }
    }
};
exports.timesToGA = timesToGA;
