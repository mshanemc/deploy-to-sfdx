/* globals it, describe, document */
import * as chai from 'chai';
import * as Nightmare from 'nightmare';
import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import * as rmfr from 'rmfr';

import { testRepos } from '../testRepos';
import { clearQueues } from '../helpers/clearRedis';
import { deployCheck } from '../helpers/deployCheck';
import { NightmarePage } from '../../src/lib/types';

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

describe('deploys all the test repos', () => {
  // eslint-disable-next-line no-restricted-syntax
  before(async () => {
    await clearQueues();
    await rmfr(tmpDir);
    fs.ensureDirSync(tmpDir);
  });

  for (const prop in testRepos) {
    describe(`deploys each repo in ${prop}`, () => {
      testRepos[prop].forEach((testRepo) => {
        it(`deploys https://github.com/${testRepo.username}/${
          testRepo.repo
        }`, async () => {
          await deployCheck(testRepo.username, testRepo.repo);
        })
          .timeout(waitTimeout)
          .retries(2);
      });
    });
  }

  describe('tests error handling', () => {
    // something about a repo that ain't there
    it('fails to deploy a bad repo, with good error messages', async () => {
      const user = 'mshanemc';
      const repo = 'this-aint-nothin';
      const url = `https://github.com/${user}/${repo}`;
      const nightmare = new Nightmare({ waitTimeout });

      const page = <NightmarePage>(
        await nightmare.goto(
          `${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${url}`
        )
      );
      expect(page.url).to.include(`deploying/deployer/${user}-${repo}-`);

      await nightmare.wait('div#errorBlock');
      const hasError = await nightmare.exists('div#errorBlock');
      expect(hasError).to.be.true;

      return nightmare.wait(1000).end();
    })
      .timeout(waitTimeout)
      .retries(2);
  });

  after(async () => {
    await rmfr(tmpDir);
    await clearQueues();
  });
});
