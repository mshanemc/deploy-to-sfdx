// asynchronously posts the lead form back to org62
import axios from 'axios';
import logger from 'heroku-logger';

import { getLead, getLeadQueueSize, putFailedLead } from '../lib/redisNormal';

const sfdcLeadCaptureServlet = process.env.sfdcLeadCaptureServlet;
const requestPage = '/form.html';
const resultPage = '/conf.html';
const requestHost = 'www.salesforce.com';

const leadCreate = async function(incoming) {
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

    await axios({
        url: sfdcLeadCaptureServlet,
        method: 'POST',
        // strictSSL: false,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: formPostBody
        // simple: true
    });
};

(async () => {
    logger.debug('Lead queue consumer is up');
    while ((await getLeadQueueSize()) > 0) {
        const lead = await getLead();
        try {
            await leadCreate(lead);
        } catch (e) {
            logger.error('error in trialLeadCreate', e);
            await putFailedLead(lead);
        }
    }
    process.exit(0);
})();
