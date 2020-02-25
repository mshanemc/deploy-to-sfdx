import { getCloneCommands } from '../../lib/namedUtilities';
import { DeployRequest } from '../../lib/types';

const baseObj = {
    deployId: 'test-deploy-id',
    createdTimestamp: new Date()
};

const repo1 = 'cg4Integrate';
const repo2 = 'df17appbuilding';
const username = 'mshanemc';

describe('deployReq test-deploy-iding', () => {
    test('handles single repo', () => {
        const req: DeployRequest = {
            ...baseObj,
            repos: [
                {
                    username,
                    repo: repo1,
                    source: 'github'
                }
            ]
        };

        const results = getCloneCommands(req);

        // multi
        expect(results).toHaveLength(1);
        expect(results[0]).toBe(`git clone -b master --single-branch https://github.com/${username}/${repo1}.git ${baseObj.deployId}`);
    });

    test('handles single repo with branch', () => {
        const req: DeployRequest = {
            ...baseObj,
            repos: [
                {
                    username,
                    repo: repo1,
                    source: 'github',
                    branch: 'platypus'
                }
            ]
        };

        const results = getCloneCommands(req);

        // multi
        expect(results).toHaveLength(1);
        expect(results[0]).toBe(`git clone -b platypus --single-branch https://github.com/${username}/${repo1}.git ${baseObj.deployId}`);
    });

    test('handles multi repo', () => {
        const req: DeployRequest = {
            ...baseObj,
            repos: [
                {
                    username,
                    repo: repo1,
                    source: 'github'
                },
                {
                    username,
                    repo: repo2,
                    source: 'github'
                }
            ]
        };

        const results = getCloneCommands(req);

        // multi
        expect(results).toHaveLength(2);
        expect(results[0]).toBe(`git clone -b master --single-branch https://github.com/${username}/${repo1}.git ${baseObj.deployId}/${repo1}`);
        expect(results[1]).toBe(`git clone -b master --single-branch https://github.com/${username}/${repo2}.git ${baseObj.deployId}/${repo2}`);
    });
});
