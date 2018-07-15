/* globals it, describe */
const Nightmare = require('nightmare');
const chai = require('chai');

const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 300000;

if (!testEnv){
  throw new Error('export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]');
}

describe('deploys actual repos', () => {
  it('deploys https://github.com/mshanemc/df17IntegrationWorkshops', function (done) {
    const repo = 'https://github.com/mshanemc/df17IntegrationWorkshops';

    const nightmare = new Nightmare({ show: true, waitTimeout });
    nightmare
      .goto(`${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${repo}`)
      .then((page) => {
        expect(page.url).to.include('deploying/deployer/mshanemc-df17IntegrationWorkshops-');
        console.log(page);
        return nightmare
          .wait('a#loginURL[href*="https:"]')
          .evaluate(function () {
            return document.querySelector('#loginUrl').href;
          });
      })
      .then((result) => {
        console.log(result);
        expect(result).to.include('my.salesforce.com/secur/frontdoor.jsp');
        return nightmare
          .click('#deleteButton')
          .wait('h2#deleteConfirmMessage')
          .wait(500)
          .end();
      })
      .then((result) => {
        console.log(result);
        done();
      });
      // .wait('#loginUrl')
      // .end()
      // .evaluate(() => document.querySelector('#loginUrl').href)
      // .then(link => {
      //   expect(link).to.include('my.salesforce.com/secur/frontdoor.jsp');
      //   done();
      // });
  }).timeout(1000*60*5);
});