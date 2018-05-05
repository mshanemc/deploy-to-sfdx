/* globals it, describe */

const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai
const utilities = require('./../lib/utilities.js');

describe('Utilities: getArg', function () {

  it('handles getArg with -d', function () {
    const cmd = 'sfdx shane:heroku:repo:deploy -d 500';
    expect(utilities.getArg(cmd, '-d')).to.equal('500');
  });

  it('handles getArg with --days', function () {
    const cmd = 'sfdx shane:heroku:repo:deploy --days 500 --json';
    expect(utilities.getArg(cmd, '--days')).to.equal('500');
  });

  it('handles getArg with -d after single param', function () {
    const cmd = 'sfdx shane:heroku:repo:deploy --json --days 500';
    expect(utilities.getArg(cmd, '--days')).to.equal('500');
  });


});