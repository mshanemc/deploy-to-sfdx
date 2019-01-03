/* globals it, describe, document */
import * as chai from 'chai';
import * as Nightmare from 'nightmare';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as rimraf from 'rimraf';

import { testRepos } from './../testRepos';

dotenv.config();

const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15;
const tmpDir = 'tmp';

if (!testEnv) {
  throw new Error(
    'export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]'
  );
}

const deployCheck = async (user, repo) => {
  const url = `https://github.com/${user}/${repo}`;
  const nightmare = new Nightmare({ show: true, waitTimeout });

  const page = <NightmarePage>(
    await nightmare.goto(
      `${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${url}`
    )
  );
  expect(page.url).to.include(`deploying/deployer/${user}-${repo}-`);

  await nightmare.wait('a#loginURL[href*="https:"]');

  const href = await nightmare.evaluate(
    () => (<HTMLAnchorElement>document.querySelector('#loginUrl')).href
  );
  expect(href).to.be.a('string');

  // verify that loading icon eventually stops spinning
  let loading: boolean = true;

  while (loading) {
    loading = <boolean>(<unknown> await nightmare.exists('#loaderBlock'));
  }

  expect(loading).to.be.false;

  const hasError = await nightmare.exists('#errorBlock');
  expect(hasError).to.be.false;

  // return nightmare.click('#deleteButton').wait(1000).end();
};

describe('deploys all the test repos', () => {
  // eslint-disable-next-line no-restricted-syntax
  before(async () => {
    rimraf.sync(tmpDir);
    fs.ensureDirSync(tmpDir);
  });

  describe('runs platform workshops', () => {
    for (const testRepo of testRepos.platformWorkshops) {
      it(`deploys https://github.com/${testRepo.username}/${
        testRepo.repo
      }`, async () => {
        await deployCheck(testRepo.username, testRepo.repo);
      }).timeout(waitTimeout);
    }
  });

  describe('runs adoption workshops', () => {
    for (const testRepo of testRepos.adoptionWorkshops) {
      it(`deploys https://github.com/${testRepo.username}/${
        testRepo.repo
      }`, async () => {
        await deployCheck(testRepo.username, testRepo.repo);
      }).timeout(waitTimeout);
    }
  });

  describe('runs campground demos', () => {
    for (const testRepo of testRepos.campground) {
      it(`deploys https://github.com/${testRepo.username}/${
        testRepo.repo
      }`, async () => {
        await deployCheck(testRepo.username, testRepo.repo);
      }).timeout(waitTimeout);
    }
  });

  describe('runs other demos and trial', () => {
    for (const testRepo of testRepos.other) {
      it(`deploys https://github.com/${testRepo.username}/${
        testRepo.repo
      }`, async () => {
        await deployCheck(testRepo.username, testRepo.repo);
      }).timeout(waitTimeout);
    }
  });

  describe('tests error handling', () => {
    // something about a repo that ain't there
    it('fails to deploy a bad repo, with good error messages', async () => {
      const user = 'mshanemc';
      const repo = 'this-aint-nothin';
      const url = `https://github.com/${user}/${repo}`;
      const nightmare = new Nightmare({ show: true, waitTimeout });

      const page = <NightmarePage>(
        await nightmare.goto(
          `${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${url}`
        )
      );
      expect(page.url).to.include(`deploying/deployer/${user}-${repo}-`);

      await nightmare.wait(1000 * 8);

      const hasError = await nightmare.exists('#errorBlock');
      expect(hasError).to.be.true;

      return nightmare.wait(1000).end();
    }).timeout(waitTimeout);
  })

  after(() => {
    rimraf.sync(tmpDir);
  });
});

interface NightmarePage {
  url?: string;
}
