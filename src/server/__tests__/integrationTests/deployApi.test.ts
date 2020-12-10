import request from 'request-promise-native';
import { getTestURL } from '../helpers/testingUtils';
import { retry } from '@lifeomic/attempt';
import { sfdxTimeout } from '../helpers/testingUtils';

const testURL = getTestURL();
const repo = {
    username: 'mshanemc',
    repo: 'df17AppBuilding'
};

test('deploys a repo from github via API, verifies completion, and deletes', async () => {
    jest.setTimeout(sfdxTimeout);
    const response = await request.post({
        url: `${testURL}/launch`,
        body: {
            pool: false,
            repos: [repo]
        },
        json: true,
        resolveWithFullResponse: true
    });
    console.log(response.body.deployId);
    expect(response.statusCode).toBe(200);
    expect(response.body.deployId).toContain(repo.username);
    expect(response.body.deployId).toContain(repo.repo);

    // wait for it
    const deployResult = await retry(
        async () => {
            const status = await request({
                url: `${testURL}/results/${response.body.deployId}`,
                json: true
            });
            console.log(status);
            if (!status.complete) {
                throw new Error('still polling');
            }
            return status;
        },
        {
            delay: 10000,
            maxAttempts: 30
        }
    );
    console.log(deployResult);
    expect(deployResult.complete).toBe(true);
    expect(deployResult.errors).toHaveLength(0);
    expect(deployResult.mainUser.username).toBeTruthy();
    expect(deployResult.orgId).toBeTruthy();
    expect(deployResult.expirationDate).toBeTruthy();

    // delete it by username
    const deleteResponse = await request.post({
        url: `${testURL}/delete`,
        body: {
            deployId: response.body.deployId
        },
        json: true,
        resolveWithFullResponse: true
    });
    expect(deleteResponse.body.redirectTo).toBe('/#deleteConfirm');
});
