/* globals it, describe, document */
import * as chai from 'chai';
import * as Nightmare from 'nightmare';
import * as dotenv from 'dotenv';
import { clearQueues } from '../helpers/clearRedis';

dotenv.config();

const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15; // 15 minutes should do it
const tmpDir = 'tmp';

if (!testEnv) {
  throw new Error(
    'export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]'
  );
}

describe('runs the trial', async () => {
  // eslint-disable-next-line no-restricted-syntax
  const nightmare = new Nightmare({
    show: true,
    waitTimeout,
    openDevTools: { mode: 'detach' },
    typeInterval: 10
  });
  const url = 'https://github.com/mshanec/platformTrial';
  let page;
  it('loads the test form', async () => {
    page = <NightmarePage>(
      await nightmare.goto(`${process.env.DEPLOYER_TESTING_ENDPOINT}/testform`)
    );
    expect(page.url).to.include('/testform');
  }).timeout(waitTimeout);

  it('fills out the test form and ends up on the trial page', async () => {
    page = <NightmarePage>(
      await nightmare.goto(`${process.env.DEPLOYER_TESTING_ENDPOINT}/testform`)
    );
    await nightmare.wait('input#UserEmail');
    expect(await nightmare.exists('input#UserEmail'));
    expect(await nightmare.exists('input#UserFirstName'));
    expect(await nightmare.exists('input#UserLastName'));
    expect(await nightmare.exists('input#submitButton'));

    await nightmare.type('input#UserEmail', 'shane.mclaughlin@salesforce.com');
    await nightmare.type('input#UserFirstName', 'shane');
    await nightmare.type('input#UserLastName', 'mclaughlin');
    await nightmare.click('#submitButton');

    await nightmare.wait(1000);
    const deployingUrl = await nightmare.url();
    expect(deployingUrl).to.include('/deploying/trial/mshanemc-platformTrial-');

    // console.log('on the trial loading page');
    // // await nightmare.waitForUrl(/\/deploying\/trial\//);
    // // await nightmare.wait('.bluebar');

    // // await nightmare.wait('#UserEmail');
    // // console.log('blue bar is present');

    // expect(await nightmare.exists('#trialContent'));
    // expect(await nightmare.exists('header#sfheader'));

    // await nightmare.wait('div.cTrialWelcome2');
  }).timeout(waitTimeout);

  it('verifies the loading page content and eventually gets to a trial', async () => {
    expect(await nightmare.exists('#trialContent'));
    expect(await nightmare.exists('header#sfheader'));

    await nightmare.wait('div.cTrialWelcome2');
    const trialUrl = await nightmare.url();

    expect(trialUrl).to.include('lightning.force');
  }).timeout(waitTimeout);

  before(async () => {
    await clearQueues();
  });

  after(async() => {
    await nightmare.end();
  });
});

interface NightmarePage {
  url?: string;
}
