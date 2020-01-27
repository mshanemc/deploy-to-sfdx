/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import request from 'request-promise-native';
import { sleep, retry } from '@lifeomic/attempt';

import { getTestURL } from './../helpers/testingUtils';
import { cdsDelete } from '../../lib/redisNormal';
import { CDS } from '../../lib/CDS';
import { processDeleteQueue } from '../../lib/skimmerSupport';
import { TestRepo } from '../../lib/types';
import { multiTemplateURLBuilder } from '../../lib/multiTemplateURLBuilder';

const retryOptions = { maxAttempts: 3 };
const baseUrl = getTestURL();

const deployCheck = async (testRepo: TestRepo) => {
    await fs.ensureDir('tmp');
    return deployCheckMulti([testRepo]);
};

const deployCheckMulti = async (testRepos: TestRepo[]) => {
    await fs.ensureDir('tmp');
    const urls = testRepos.map(testRepo =>
        testRepo.branch
            ? `https://github.com/${testRepo.username}/${testRepo.repo}/tree/${testRepo.branch}`
            : `https://github.com/${testRepo.username}/${testRepo.repo}`
    );

    // console.debug(`URLS are`, urls);

    await retry(async () => {
        // get the launch page and follow the path
        const startResult = await request({
            url: multiTemplateURLBuilder(urls, `${baseUrl}/launch`),
            resolveWithFullResponse: true
        });

        // expect the deploying page redirect.  Get its url so we can check its results by id
        const deployId = startResult.req.path.replace('/deploying/deployer/', '');
        const resultsUrl = `${baseUrl}/results/${deployId}`;

        let status = new CDS({
            deployId
        });

        // fetch get the /results url until it's complete
        while (!status.complete) {
            status = await request({
                url: resultsUrl,
                json: true
            });
            await sleep(1000);
        }

        await cdsDelete(deployId);
        await processDeleteQueue();

        expect(status.complete).toBe(true);
        expect(status.errors).toHaveLength(0);
        expect(status.mainUser.username).toBeTruthy();
        expect(status.orgId).toBeTruthy();
        expect(status.expirationDate).toBeTruthy();
        return status;
    }, retryOptions);
};
export { deployCheck, deployCheckMulti };
