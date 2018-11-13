// asynchronously posts the lead form back to org62
const request = require('request');
const sfdcLeadCaptureServlet = process.env.sfdcLeadCaptureServlet;
const requestPage = '/form.html';
const resultPage = '/conf.html';
const requestHost = 'www.salesforce.com';
module.exports = function (incoming) {
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
    console.log(formPostBody);
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
// requestHost=www.salesforce.com
// requestPage=/form.html
// resultPage=/conf.html
// Lead.LeadSource=Qualified+leads
// UserFirstName=Ned
// UserLastName=Leonard
// CompanyName=Enormoco
// UserTitle=developer
// UserEmail=nleonard%40salesforce.com
// UserPhone=5555555555
// CompanyState=CA
// CompanyPostalCode=94111
// CompanyEmployees=5
// CompanyCountry=US
// mcloudFormName=GLOB_MAIN_T2L1_OCMS_LCS1
// Lead.LeadSource=Organic+Search
// FormCampaignId=7010M000000nQr6QAE
// DriverCampaignId=70130000000sUVb
