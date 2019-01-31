"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("heroku-logger");
const timesToGA = (msgJSON, CDS) => {
    try {
        msgJSON.visitor
            .timing('time in queue', msgJSON.template, CDS.buildStartTime.getTime() - CDS.browserStartTime.getTime())
            .send();
        msgJSON.visitor
            .timing('time to build', msgJSON.template, CDS.completeTimestamp.getTime() - CDS.buildStartTime.getTime())
            .send();
        msgJSON.visitor
            .timing('time until fully deployed', msgJSON.template, CDS.completeTimestamp.getTime() - CDS.browserStartTime.getTime())
            .send();
        msgJSON.visitor
            .timing('time until open button appears', msgJSON.template, CDS.openTimestamp.getTime() - CDS.browserStartTime.getTime())
            .send();
    }
    catch (e) {
        logger.warn('GA timestamps not firing', msgJSON);
    }
};
exports.timesToGA = timesToGA;
