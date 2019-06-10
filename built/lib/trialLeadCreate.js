"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise-native");
const logger = require("heroku-logger");
const events_1 = require("events");
const emitter = new events_1.EventEmitter();
const sfdcLeadCaptureServlet = process.env.sfdcLeadCaptureServlet;
const requestPage = '/form.html';
const resultPage = '/conf.html';
const requestHost = 'www.salesforce.com';
const emitLead = incoming => {
    emitter.emit('lead', incoming);
};
exports.emitLead = emitLead;
emitter.on('lead', async (incoming) => {
    if (process.env.sfdcLeadCaptureServlet) {
        await leadCreate(incoming);
    }
});
const leadCreate = async function (incoming) {
    const formPostBody = {
        UserFirstName: incoming.UserFirstName,
        UserLastName: incoming.UserLastName,
        CompanyName: incoming.CompanyName,
        UserTitle: incoming.UserTitle,
        UserEmail: incoming.UserEmail,
        UserPhone: incoming.UserPhone,
        CompanyState: incoming.CompanyState,
        CompanyPostalCode: incoming.CompanyPostalCode,
        CompanyEmployees: incoming.CompanyEmployees,
        CompanyCountry: incoming.CompanyCountry,
        mcloudFormName: incoming.mcloudFormName,
        'Lead.LeadSource': incoming['Lead.LeadSource'],
        FormCampaignId: incoming.FormCampaignId,
        DriverCampaignId: incoming.DriverCampaignId,
        requestPage,
        resultPage,
        requestHost
    };
    try {
        await request({
            url: sfdcLeadCaptureServlet,
            method: 'POST',
            strictSSL: false,
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            form: formPostBody
        });
    }
    catch (e) {
        logger.error('error in trialLeadCreate');
    }
};
