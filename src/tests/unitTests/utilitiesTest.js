/* globals it, describe */

const chai = require('chai');

// const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai
const utilities = require('./../../lib/utilities.js');

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


});