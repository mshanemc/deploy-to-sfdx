/* globals it, describe */
// import * as chai from 'chai';
// const assert = chai.assert;
// const expect = chai.expect; // we are using the "expect" style of Chai
const leadCreate = require('./../../lib/trialLeadCreate.js');
describe('org62LeadCreate', () => {
    const formBody = {
        UserFirstName: 'Tr7ial',
        UserLastName: 'Tes7ter',
        CompanyName: 'Enor7moco',
        UserTitle: 'devel7oper',
        UserEmail: 'shaneTest@thisismailtest1234567.com',
        UserPhone: '5555555555',
        CompanyState: 'CA',
        CompanyPostalCode: '94111',
        CompanyEmployees: '5',
        CompanyCountry: 'US',
        mcloudFormName: 'GLOB_MAIN_T2L1_OCMS_LCS1',
        'Lead.LeadSource': 'Organic+Search',
        FormCampaignId: '7010M000000nQr6QAE',
        DriverCampaignId: '70130000000sUVb'
    };
    it('sends the lead', () => {
        const result = leadCreate(formBody);
        console.log(result);
        // expect(argStripper(cmd, '-a', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s -d 1');
    });
});
