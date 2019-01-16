import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as util from 'util';

import * as fs from 'fs-extra';
import * as rmfr from 'rmfr';

import { testRepos } from '../testRepos';
import { lineParse } from '../../src/lib/lineParse';
import * as utilities from '../../src/lib/utilities';

import {
  deployRequest,
  testRepo,
  poolOrg,
  deployMessage
} from '../../src/lib/types';
import { exec } from 'child_process';

const expect = chai.expect;
// const assert = chai.assert;
// const expect = chai.expect; // we are using the "expect" style of Chai

chai.use(chaiAsPromised);

const testDir = 'tmp'; // has to match what's expected by the parser
const deployId = 'testDepId';
const testFileLoc = `${testDir}/${deployId}`;
const testOrgInitLoc = `${testFileLoc}/orgInit.sh`;

const execProm = util.promisify(exec);

const timeOutLocalFS = 3000;
const testDepReqWL: deployRequest = {
  deployId,
  repo: 'testItOut',
  whitelisted: true
};

const testDepReq: deployRequest = {
  deployId,
  repo: 'testItOut',
  whitelisted: false
};

describe('lineParserLocalTests', () => {
  before(async () => {
    await rmfr(testDir);
  });

  describe('whitelisted', () => {
    beforeEach(async () => {
      await fs.ensureDir(testFileLoc);
    });

    it('returns a basic one untouched', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = 'echo "hello world"';
      await fs.writeFile(testOrgInitLoc, fileContents);
      const parsedLines = await lineParse(testDepReqWL);
      expect(parsedLines).to.be.an('array');
      expect(parsedLines.length).to.equal(1);
      expect(parsedLines[0]).to.equal(fileContents);
      // expect(parsedLines[0]).to.equal(fileContents);
    });

    it('properly removes comments', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = `
      echo "hello world"
      # says hello world`;
      await fs.writeFile(testOrgInitLoc, fileContents);
      const parsedLines = await lineParse(testDepReqWL);
      // expect(parsedLines).to.equal(Array(1).fill(fileContents));
      expect(parsedLines).to.be.an('array');
      expect(parsedLines.length).to.equal(1);
      expect(parsedLines[0]).to.equal('echo "hello world"');
    });

    it('properly removes empty lines', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = `echo "hello world"


      # says hello world`;
      await fs.writeFile(testOrgInitLoc, fileContents);
      const parsedLines = await lineParse(testDepReqWL);
      // expect(parsedLines).to.equal(Array(1).fill(fileContents));
      expect(parsedLines).to.be.an('array');
      expect(parsedLines.length).to.equal(1);
      expect(parsedLines[0]).to.equal('echo "hello world"');
    });

    it('adds json to sfdx commands', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = `
      echo "hello world"
      sfdx force:org:open`;
      await fs.writeFile(testOrgInitLoc, fileContents);
      const parsedLines = await lineParse(testDepReqWL);
      // expect(parsedLines).to.equal(Array(1).fill(fileContents));
      expect(parsedLines).to.be.an('array');
      expect(parsedLines.length).to.equal(2);
      expect(parsedLines[0]).to.equal('echo "hello world"');
      expect(parsedLines[1]).to.equal('sfdx force:org:open --json');
    });

    it('leaves non-sfdx commands untouched', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = `
      echo "hello world"
      something force:org:open`;
      await fs.writeFile(testOrgInitLoc, fileContents);
      const parsedLines = await lineParse(testDepReqWL);
      // expect(parsedLines).to.equal(Array(1).fill(fileContents));
      expect(parsedLines).to.be.an('array');
      expect(parsedLines.length).to.equal(2);
      expect(parsedLines[0]).to.equal('echo "hello world"');
      expect(parsedLines[1]).to.equal('something force:org:open');
    });

    afterEach(async () => {
      await rmfr(testDir);
    });
  });

  describe('non-whitelisted', () => {
    beforeEach(async () => {
      await fs.ensureDir(testFileLoc);
    });

    it('throws error on shell sanitize issue', async () => {
      const fileContents = 'cat ../tmp > somewhereElse';
      await fs.writeFile(testOrgInitLoc, fileContents);
      expect(lineParse(testDepReq)).be.be.rejectedWith(
        `ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${fileContents}`
      );
    });

    it('throws error with -u commands', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = 'sfdx force:org:open -u sneaky';
      await fs.writeFile(testOrgInitLoc, fileContents);
      expect(lineParse(testDepReq)).be.be.rejectedWith(
        `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${fileContents}`
      );
    });

    it('throws error on non-sfdx commands', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = 'echo "hello world"';
      await fs.writeFile(testOrgInitLoc, fileContents);
      expect(lineParse(testDepReq)).be.be.rejectedWith(
        `ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${fileContents}`
      );
    });

    it('adds json to sfdx commands', async () => {
      // save a local orgIinit.sh in matching deploytId
      const fileContents = `sfdx force:source:push
      sfdx force:org:open`;
      await fs.writeFile(testOrgInitLoc, fileContents);
      const parsedLines = await lineParse(testDepReq);
      // expect(parsedLines).to.equal(Array(1).fill(fileContents));
      expect(parsedLines).to.be.an('array');
      expect(parsedLines.length).to.equal(2);
      expect(parsedLines[0]).to.equal('sfdx force:source:push --json');
      expect(parsedLines[1]).to.equal('sfdx force:org:open --json');
    });

    afterEach(async () => {
      await rmfr(testDir);
    });
  });

  describe('everything in test repos', () => {
    beforeEach(async () => {
      await fs.ensureDir(testDir);
    });

    for (const prop in testRepos) {
      testRepos[prop].forEach((repo) => {
        const loopedDeployId = `test-${repo.username}-${repo.repo}`;
        const depReq: deployMessage = {
          whitelisted: true,
          deployId: loopedDeployId,
          repo: repo.repo,
          username: repo.username
        };

        it(`tests ${repo.username}/${repo.repo}`, async () => {
          // git clone it
          const gitCloneCmd = utilities.getCloneCommand(depReq);
          await execProm(gitCloneCmd, { cwd: testDir});
          const parsedLines = await lineParse(depReq);
          expect(parsedLines).to.be.an('array');
        }).timeout(5000);
      });
    }

    afterEach(async () => {
      await rmfr(testDir);
    });
  });
});
