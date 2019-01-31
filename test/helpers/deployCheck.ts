import * as Nightmare from 'nightmare';
import {expect} from 'chai';
import { NightmarePage } from '../../src/lib/types';

const waitTimeout = 1000 * 60 * 15;

const deployCheck = async (user, repo) => {
  const url = `https://github.com/${user}/${repo}`;
  const nightmare = new Nightmare({
    // show: true,
    waitTimeout
    // openDevTools: { mode: 'detach' }
  });

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

  return nightmare
    .click('#deleteButton')
    .wait(1000)
    .end();
};

export { deployCheck }
