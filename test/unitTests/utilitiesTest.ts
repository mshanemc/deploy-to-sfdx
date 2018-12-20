/* globals it, describe */

import * as chai from 'chai';
import * as utilities from '../../src/lib/utilities';
import * as types from '../../src/lib/types';

const expect = chai.expect; // we are using the "expect" style of Chai

describe('Utilities: getArg', () => {

  it('handles getArg with -d', () => {
    const cmd = 'sfdx shane:heroku:repo:deploy -d 500';
    expect(utilities.getArg(cmd, '-d')).to.equal('500');
  });

  it('handles getArg with --days', () => {
    const cmd = 'sfdx shane:heroku:repo:deploy --days 500 --json';
    expect(utilities.getArg(cmd, '--days')).to.equal('500');
  });

  it('handles getArg with -d after single param', () => {
    const cmd = 'sfdx shane:heroku:repo:deploy --json --days 500';
    expect(utilities.getArg(cmd, '--days')).to.equal('500');
  });

  it('handles getArg with ` after single param', () => {
    const cmd = 'sfdx shane:heroku:repo:deploy -f --name `basename "${PWD}"` --json --days 500';
    expect(utilities.getArg(cmd, '--name')).to.equal('`basename "${PWD}"`');
  });

  it('handles getArg with ` after single param with more string after that', () => {
    const cmd = 'sfdx shane:heroku:repo:deploy -f --name `basename "${PWD}"`-stg --json --days 500';
    expect(utilities.getArg(cmd, '--name')).to.equal('`basename "${PWD}"`-stg');
  });

  it('parses url with double //', () => {
    const input = {
      status: 0,
      result: {
        url: 'https://momentum-energy-6867-dev-ed.cs16.my.salesforce.com//secur/frontdoor.jsp?sid=00Df0000003cblj!ARcAQClJTaxfz4XB9AJPE7HqAjbE3Lv4jE_Upzg..AEE25gDiV.Ko7kW25VoKu0TFKyTSZsPSmnWNatW8CeWWCuDH73DIqXJ',
        orgId: '00Df0000003cbljEAA',
        username: 'int532@work.shop'
      }
    };
    const jsonResult = utilities.urlFix(input);
    expect(jsonResult.result.url).to.equal('https://momentum-energy-6867-dev-ed.cs16.my.salesforce.com/secur/frontdoor.jsp?sid=00Df0000003cblj!ARcAQClJTaxfz4XB9AJPE7HqAjbE3Lv4jE_Upzg..AEE25gDiV.Ko7kW25VoKu0TFKyTSZsPSmnWNatW8CeWWCuDH73DIqXJ')
  });

  it('parses url without double //', () => {
    const input = {
      status: 0,
      result: {
        url: 'https://momentum-energy-6867-dev-ed.cs16.my.salesforce.com/secur/frontdoor.jsp?sid=00Df0000003cblj!ARcAQClJTaxfz4XB9AJPE7HqAjbE3Lv4jE_Upzg..AEE25gDiV.Ko7kW25VoKu0TFKyTSZsPSmnWNatW8CeWWCuDH73DIqXJ',
        orgId: '00Df0000003cbljEAA',
        username: 'int532@work.shop'
      }
    };
    const jsonResult = utilities.urlFix(input);
    expect(jsonResult.result.url).to.equal('https://momentum-energy-6867-dev-ed.cs16.my.salesforce.com/secur/frontdoor.jsp?sid=00Df0000003cblj!ARcAQClJTaxfz4XB9AJPE7HqAjbE3Lv4jE_Upzg..AEE25gDiV.Ko7kW25VoKu0TFKyTSZsPSmnWNatW8CeWWCuDH73DIqXJ')
  });


});