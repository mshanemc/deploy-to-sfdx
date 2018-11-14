/* globals it, describe */

import * as chai from 'chai';
import * as dotenv from 'dotenv';

// const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai

import * as leadCreate from '../../src/lib/trialLeadCreate';

dotenv.config();

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
		'Lead.LeadSource' : 'Organic+Search',
		FormCampaignId: '7010M000000nQr6QAE',
		DriverCampaignId: '70130000000sUVb'
	};

	it('sends the lead', () => {
		expect(process.env.sfdcLeadCaptureServlet).to.be.a('string');

		// console.log(`sending to ${ process.env.sfdcLeadCaptureServlet }`);
		const result = leadCreate(formBody);
		// expect(argStripper(cmd, '-a', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s -d 1');
	});

});