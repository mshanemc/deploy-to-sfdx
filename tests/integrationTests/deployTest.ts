/* globals it, describe, document */
import * as chai from 'chai';
import * as Nightmare from 'nightmare';
import * as dotenv from 'dotenv';

dotenv.config();


const expect = chai.expect;
const testEnv = process.env.DEPLOYER_TESTING_ENDPOINT;
const waitTimeout = 1000 * 60 * 15;

const testRepos = [
  // {
  //   username: 'mshanemc',
  //   repo: 'df17IntegrationWorkshops'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'codeForClicks'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'df17AppBuilding'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'process-automation-workshop-df17'
  // }
  // ,
  // // adoption
  // {
  //   username: 'mshanemc',
  //   repo: 'adoption-sales'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'adoption-service'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'reporting-workshop'
  // }
  // // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'lightning-go-live'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'lightning-vf'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'js-buttons'
  // }
  // ,
  // //df 17
  // {
  //   username: 'mshanemc',
  //   repo: 'cg1'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'cg4Integrate'
  // }
  // ,
  // //df18
  // {
  //   username: 'mshanemc',
  //   repo: 'cg6-lea'
  // },
  // {
  //   username: 'mshanemc',
  //   repo: 'cg4'
  // },
  // {
  //   username: 'mshanemc',
  //   repo: 'cg1-lowcode'
  // }
  // other
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'platformTrial'
  // },
  // {
  //   username: 'mshanemc',
  //   repo: 'rviot'
  // },
  // {
  //   username: 'mshanemc',
  //   repo: 'easy-spaces'
  // }
  // ,
  // {
  //   username: 'mshanemc',
  //   repo: 'mobileWebinar'
  // }
];

if (!testEnv){
  throw new Error('export DEPLOYER_TESTING_ENDPOINT=[the url of your dev environment]');
}

const deployCheck = async (user, repo) => {
  const url = `https://github.com/${user}/${repo}`;
  const nightmare = new Nightmare({ show: true, waitTimeout });

  const page = await nightmare.goto(`${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${url}`);
  expect(page.url).to.include(`deploying/deployer/${user}-${repo}-`);

  await nightmare.wait('a#loginURL[href*="https:"]');
  const href = await nightmare.evaluate(() => {
    return (<HTMLAnchorElement> document.querySelector('#loginUrl')).href;
  });
  const style = await nightmare.evaluate(() => {
    return (<HTMLElement>document.querySelector('#errorBlock')).style;
  });
  expect(style).to.be.an('object');
  expect(style).to.have.property('display', 'none');

  return nightmare.click('#deleteButton').wait(1000).end();

};

describe('deploys all the test repos', () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const testRepo of testRepos){
    it(`deploys https://github.com/${testRepo.username}/${testRepo.repo}`, async () => {
      await deployCheck(testRepo.username, testRepo.repo);
    }).timeout(waitTimeout);
  }

  // something about a repo that ain't there
  it(`fails to deploy a bad repo, with good error messages`, async () => {
    const user = 'mshanemc';
    const repo = 'this-aint-nothin';
    const url = `https://github.com/${user}/${repo}`;
    const nightmare = new Nightmare({ show: true, waitTimeout });

    const page = await nightmare.goto(`${process.env.DEPLOYER_TESTING_ENDPOINT}/launch?template=${url}`);
    expect(page.url).to.include(`deploying/deployer/${user}-${repo}-`);
    await nightmare.wait('#errorBlock');

    const style = await nightmare.evaluate(() => {
      return (<HTMLElement>document.querySelector('#errorBlock')).style;
    });
    expect(style).to.be.an('object');
    expect(style).to.have.property('display', 'none');

    // return nightmare.click('#deleteButton').wait(1000).end();


  }).timeout(waitTimeout);
});