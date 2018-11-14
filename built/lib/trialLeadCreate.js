"use strict";
// asynchronously posts the lead form back to org62
// const request = require('request');
const request = require("request");
const sfdcLeadCaptureServlet = process.env.sfdcLeadCaptureServlet;
const requestPage = '/form.html';
const resultPage = '/conf.html';
const requestHost = 'www.salesforce.com';
const leadCreate = function (incoming) {
    console.log(incoming);
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
    // console.log(formPostBody);
    request({
        url: sfdcLeadCaptureServlet,
        method: 'POST',
        strictSSL: false,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        form: formPostBody
    }, (err, httpResponse, body) => {
        console.log('*** org62capture info');
        if (err) {
            console.log('*** here is an error');
            console.log(err);
        }
        return {
            err,
            httpResponse,
            body
        };
    });
};
module.exports = leadCreate;
