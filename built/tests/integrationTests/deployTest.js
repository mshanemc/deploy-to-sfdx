"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* globals it, describe, document */
const chai = require("chai");
const Nightmare = require("nightmare");
const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15;
const testRepos = [
    {
        username: 'mshanemc',
        repo: 'df17IntegrationWorkshops'
    },
    {
        username: 'mshanemc',
        repo: 'cg1'
    },
    {
        username: 'mshanemc',
        repo: 'codeForClicks'
    },
    {
        username: 'mshanemc',
        repo: 'cg4Integrate'
    },
    {
        username: 'mshanemc',
        repo: 'process-automation-workshop-df17'
    },
    {
        username: 'mshanemc',
        repo: 'platformTrial'
    }
];
if (!testEnv) {
    throw new Error('export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]');
}
const deployCheck = async (user, repo) => {
    const url = `https://github.com/${user}/${repo}`;
    const nightmare = new Nightmare({ show: true, waitTimeout });
    const page = await nightmare.goto(`${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${url}`);
    expect(page.url).to.include(`deploying/deployer/${user}-${repo}-`);
    await nightmare.wait('a#loginURL[href*="https:"]');
    const href = await nightmare.evaluate(() => document.querySelector('#loginUrl').href);
    expect(href).to.include('my.salesforce.com/secur/frontdoor.jsp');
    return nightmare.click('#deleteButton').wait(1000).end();
};
describe('deploys all the test repos', () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const testRepo of testRepos) {
        it(`deploys https://github.com/${testRepo.username}/${testRepo.repo}`, async () => {
            await deployCheck(testRepo.username, testRepo.repo);
        }).timeout(waitTimeout);
    }
});
