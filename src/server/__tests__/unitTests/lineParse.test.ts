import fs from 'fs-extra';

// import { testRepos } from '../helpers/testRepos';
import { lineParse, securityAssertions, jsonify, byooFilter, getMaxDays, multiOrgCorrections } from '../../lib/lineParse';
// import { getCloneCommands } from '../../lib/namedUtilities';
// import { sfdxTimeout } from '../helpers/testingUtils';
// import { execProm } from '../../lib/execProm';

import { DeployRequest } from '../../lib//types';
import { filesToLines } from '../../lib/fileToLines';

const testDir = 'tmp'; // has to match what's expected by the parser
const deployId = 'testDepId';
const testFileLoc = `${testDir}/${deployId}`;
const testOrgInitLoc = `${testFileLoc}/orgInit.sh`;

// const timeOutLocalFS = 3000;
const harmlessCommand = 'sfdx force:apex:execute -f myScript.cls';
const harmlessCommandWithJson = `${harmlessCommand} --json`;

const testDepReqWL: DeployRequest = {
    deployId,
    createdTimestamp: new Date(),
    repos: [
        {
            username: 'mshanemc',
            repo: 'testItOut',
            source: 'github',
            whitelisted: true
        }
    ]
};

const testDepReqWLMulti: DeployRequest = {
    deployId,
    createdTimestamp: new Date(),
    repos: [
        {
            username: 'mshanemc',
            repo: 'inputFile1',
            source: 'github',
            whitelisted: true
        },
        {
            username: 'mshanemc',
            repo: 'inputFile2',
            source: 'github',
            whitelisted: true
        }
    ]
};

const file1Length = 8;
const file2Length = 7;

// const testDepReq: DeployRequest = {
//     deployId,
//     repo: 'testItOut',
//     repos: [
//         {
//             username: 'mshanemc',
//             repo: 'testItOut',
//             source: 'github',
//             whitelisted: false
//         }
//     ],
//     createdTimestamp: new Date()
// };
describe('multiOrgCorrections', () => {
    it('works with single password command', async () => {
        const lines = await filesToLines([
            './src/server/__tests__/helpers/initFiles/inputFile1',
            './src/server/__tests__/helpers/initFiles/inputFile2'
        ]);
        expect(multiOrgCorrections(lines).filter((line) => line.includes('user:password')).length).toBe(1);
    });
    it('works with no password command', async () => {
        const lines = await filesToLines([
            './src/server/__tests__/helpers/initFiles/inputFile1',
            './src/server/__tests__/helpers/initFiles/inputFile2'
        ]);
        expect(
            multiOrgCorrections(lines.filter((line) => !line.includes('user:password'))).filter((line) => line.includes('user:password')).length
        ).toBe(0);
    });
    it('works with multiple password command', async () => {
        const lines = await filesToLines([
            './src/server/__tests__/helpers/initFiles/inputFile1',
            './src/server/__tests__/helpers/initFiles/inputFile2'
        ]);
        lines.push('sfdx force:user:password:generate');
        expect(multiOrgCorrections(lines).filter((line) => line.includes('user:password')).length).toBe(1);
    });
});

describe('maxDays', () => {
    it('works on a two repos with defined -d', async () => {
        const lines = await filesToLines([
            './src/server/__tests__/helpers/initFiles/inputFile1',
            './src/server/__tests__/helpers/initFiles/inputFile2'
        ]);
        expect(getMaxDays(lines)).toBe(2);
    });

    it('works on a two repos with one having undefined -d', async () => {
        const lines = await filesToLines([
            './src/server/__tests__/helpers/initFiles/inputFile1',
            './src/server/__tests__/helpers/initFiles/inputFile2'
        ]);
        expect(getMaxDays(lines.map((line) => line.replace(' -d 1', '')))).toBe(7);
    });

    it('works on a two repos with both having undefined -d', async () => {
        const lines = await filesToLines([
            './src/server/__tests__/helpers/initFiles/inputFile1',
            './src/server/__tests__/helpers/initFiles/inputFile2'
        ]);
        expect(getMaxDays(lines.map((line) => line.replace(' -d 1', '').replace(' -d 2', '')))).toBe(7);
    });
});

describe('end-to-end tests', () => {
    beforeEach(async () => {
        await fs.remove(testDir);
        await fs.ensureDir(testFileLoc);
    });

    test('single repo', async () => {
        await fs.copy('./src/server/__tests__/helpers/initFiles/inputFile1', testOrgInitLoc);
        const results = await lineParse(testDepReqWL);
        expect(results).toHaveLength(file1Length);
        expect(results.every((line) => line.includes(' --json'))).toBe(true);
    });

    test('single repo byoo', async () => {
        await fs.copy('./src/server/__tests__/helpers/initFiles/inputFile1', testOrgInitLoc);
        await fs.copy('./src/server/__tests__/helpers/initFiles/sfdx-project.json', `${testFileLoc}/sfdx-project.json`);
        const results = await lineParse({
            ...testDepReqWL,
            byoo: {
                username: 'shane',
                instanceUrl: 'force.com',
                orgId: '00Ddfdfdfdf',
                accessToken: 'helpme'
            }
        });
        expect(results).toHaveLength(file1Length);
        expect(results.every((line) => line.includes(' --json'))).toBe(true);
    });

    test('multi repo', async () => {
        await fs.copy('./src/server/__tests__/helpers/initFiles/inputFile1', `${testFileLoc}/inputFile1/orgInit.sh`);
        await fs.copy('./src/server/__tests__/helpers/initFiles/inputFile2', `${testFileLoc}/inputFile2/orgInit.sh`);
        const results = await lineParse(testDepReqWLMulti);
        // remvoes 1 line (the org:create on the 2nd file)
        expect(results).toHaveLength(file1Length + file2Length - 1);
        expect(results.every((line) => line.includes(' --json'))).toBe(true);
    });

    // test.skip('multi byoo', async () => {});

    afterAll(async () => {
        await fs.remove(testDir);
    });
});

describe('securityAssertions', () => {
    test('passes on harmless thing', () => {
        expect(securityAssertions(harmlessCommand)).toBe(harmlessCommand);
    });
    test('throws on metaChar', () => {
        const line = '>';
        expect(() => securityAssertions(line)).toThrow();
    });
    test('throws on -u', () => {
        const line = 'sfdx -u somebody';
        expect(() => securityAssertions(line)).toThrow();
    });
    test('throws on non-sfdx', () => {
        const line = 'hi there';
        expect(() => securityAssertions(line)).toThrow();
    });
});

describe('jsonify', () => {
    // const harmlessCommandWithJson = `${harmlessCommand} --json`;
    test('adds json on sfdx', () => {
        expect(jsonify(harmlessCommand)).toBe(harmlessCommandWithJson);
    });
    test('leaves non-sfdx command untouched', () => {
        const nonSFDX = 'hello, world';
        expect(jsonify(nonSFDX)).toBe(nonSFDX);
    });
});

describe('byooFilter', () => {
    // const harmlessCommandWithJson = `${harmlessCommand} --json`;

    test('false for org:create', () => {
        const line = 'sfdx force:org:create -f config';
        expect(byooFilter(line)).toBe(false);
    });
    test('false for user:password', () => {
        const line = 'sfdx force:user:password';
        expect(byooFilter(line)).toBe(false);
    });
    test('true for anything else', () => {
        const line = 'hello, world';
        expect(byooFilter(line)).toBe(true);
    });
});

// describe.skip('lineParserLocalTests', () => {
//     beforeAll(async () => {
//         await fs.remove(testDir);
//     });

//     describe('whitelisted', () => {
//         beforeEach(async () => {
//             await fs.ensureDir(testFileLoc);
//         });

//         test('returns a basic one untouched', async () => {
//             // save a local orgIinit.sh in matching deploytId
//             const fileContents = harmlessCommand;
//             await fs.writeFile(testOrgInitLoc, fileContents);
//             const parsedLines = await lineParse(testDepReqWL);
//             expect(parsedLines.length).toBe(1);
//             expect(parsedLines[0]).toBe(harmlessCommandWithJson);
//             // expect(parsedLines[0]).to.equal(fileContents);
//         });

//         test('properly removes comments', async () => {
//             // save a local orgIinit.sh in matching deploytId
//             const fileContents = `
//       echo "hello world"
//       # says hello world`;
//             await fs.writeFile(testOrgInitLoc, fileContents);
//             const parsedLines = await lineParse(testDepReqWL);
//             // expect(parsedLines).to.equal(Array(1).fill(fileContents));
//             expect(parsedLines.length).toBe(1);
//             expect(parsedLines[0]).toBe('echo "hello world"');
//         });

//         test('properly removes empty lines', async () => {
//             // save a local orgIinit.sh in matching deploytId
//             const fileContents = `echo "hello world"

//       # says hello world`;
//             await fs.writeFile(testOrgInitLoc, fileContents);
//             const parsedLines = await lineParse(testDepReqWL);
//             // expect(parsedLines).to.equal(Array(1).fill(fileContents));
//             expect(parsedLines.length).toBe(1);
//             expect(parsedLines[0]).toBe('echo "hello world"');
//         });

//         test('adds json to sfdx commands, with -r on org open', async () => {
//             // save a local orgIinit.sh in matching deploytId
//             const fileContents = `
//       echo "hello world"
//       sfdx force:org:open`;
//             await fs.writeFile(testOrgInitLoc, fileContents);
//             const parsedLines = await lineParse(testDepReqWL);
//             // expect(parsedLines).to.equal(Array(1).fill(fileContents));
//             expect(parsedLines.length).toBe(2);
//             expect(parsedLines[0]).toBe('echo "hello world"');
//             expect(parsedLines[1]).toBe('sfdx force:org:open --json -r');
//         });

//         test('leaves non-sfdx commands untouched', async () => {
//             // save a local orgIinit.sh in matching deploytId
//             const fileContents = `
//       echo "hello world"
//       something force:org:open`;
//             await fs.writeFile(testOrgInitLoc, fileContents);
//             const parsedLines = await lineParse(testDepReqWL);
//             // expect(parsedLines).to.equal(Array(1).fill(fileContents));
//             expect(parsedLines.length).toBe(2);
//             expect(parsedLines[0]).toBe('echo "hello world"');
//             expect(parsedLines[1]).toBe('something force:org:open');
//         });

//         test.skip('two repos, whitelisted', async () => {});

//         afterEach(async () => {
//             await fs.remove(testDir);
//         });
//     });

//     describe('non-whitelisted', () => {
//         beforeEach(async () => {
//             await fs.ensureDir(testFileLoc);
//         });

//         // test('throws error on shell sanitize issue', async () => {
//         //     const fileContents = 'cat ../tmp > somewhereElse';
//         //     await fs.writeFile(testOrgInitLoc, fileContents);
//         //     //  await expect(deleteOrg('hack@you.bad;wget')).rejects.toEqual(Error('invalid username hack@you.bad;wget'));
//         //     await expect(lineParse(testDepReq)).rejects.toThrow(
//         //         new Error(
//         //             `ERROR: Commands with metacharacters cannot be executed.  Put each command on a separate line.  Your command: ${fileContents}`
//         //         )
//         //     );
//         // });

//         // test('throws error with -u commands', async () => {
//         //     // save a local orgIinit.sh in matching deploytId
//         //     const fileContents = 'sfdx force:org:open -u sneaky';
//         //     await fs.writeFile(testOrgInitLoc, fileContents);
//         //     console.log(await lineParse(testDepReq));
//         //     await expect(lineParse(testDepReq)).rejects.toThrow(
//         //         new Error(
//         //             `ERROR: Commands can't contain -u...you can only execute commands against the default project the deployer creates--this is a multitenant sfdx deployer.  Your command: ${fileContents}`
//         //         )
//         //     );
//         // });

//         // test('throws error on non-sfdx commands', async () => {
//         //     // save a local orgIinit.sh in matching deploytId
//         //     const fileContents = 'echo "hello world"';
//         //     await fs.writeFile(testOrgInitLoc, fileContents);
//         //     await expect(lineParse(testDepReq)).rejects.toThrow(
//         //         new Error(`ERROR: Commands must start with sfdx or be comments (security, yo!).  Your command: ${fileContents}`)
//         //     );
//         // });

//         test('adds json to sfdx commands', async () => {
//             // save a local orgIinit.sh in matching deploytId
//             const fileContents = `sfdx force:source:push
//       sfdx force:org:open`;
//             await fs.writeFile(testOrgInitLoc, fileContents);
//             const parsedLines = await lineParse(testDepReq);
//             // expect(parsedLines).to.equal(Array(1).fill(fileContents));
//             expect(parsedLines.length).toBe(2);
//             expect(parsedLines[0]).toBe('sfdx force:source:push --json');
//             expect(parsedLines[1]).toBe('sfdx force:org:open --json -r');
//         });

//         afterEach(async () => {
//             await fs.remove(testDir);
//         });
//     });

//     describe('everything in test repos', () => {
//         jest.setTimeout(sfdxTimeout);

//         beforeEach(async () => {
//             await fs.ensureDir(testDir);
//         });

//         for (const prop in testRepos) {
//             testRepos[prop].forEach(repo => {
//                 const loopedDeployId = `test-${repo.username}-${repo.repo}`;
//                 const depReq: DeployRequest = {
//                     whitelisted: true,
//                     deployId: loopedDeployId,
//                     repo: repo.repo,
//                     username: repo.username,
//                     createdTimestamp: new Date(),
//                     repos: [
//                         {
//                             username: repo.username,
//                             repo: repo.repo,
//                             source: 'github',
//                             whitelisted: true
//                         }
//                     ]
//                 };

//                 if (repo.branch) {
//                     depReq.branch = repo.branch;
//                 }

//                 test(`tests ${repo.username}/${repo.repo}`, async () => {
//                     // git clone it
//                     const gitCloneCmd = getCloneCommands(depReq)[0];
//                     await execProm(gitCloneCmd, { cwd: testDir });
//                     await lineParse(depReq);
//                 });
//             });
//         }

//         afterEach(async () => {
//             await fs.remove(testDir);
//         });
//     });
// });
