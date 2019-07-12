import * as fs from 'fs-extra';
import * as request from 'request-promise-native';
import { sleep, retry } from '@lifeomic/attempt';

import { getTestURL } from './../helpers/testingUtils';
import { cdsDelete } from './../../src/lib/redisNormal';
import { CDS } from './../../src/lib/CDS';
import { processDeleteQueue } from './../../src/lib/skimmerSupport';

const retryOptions = { maxAttempts: 3 };

const deployCheck = async (user: string, repo: string) => {
    await fs.ensureDir('tmp');

    const baseUrl = getTestURL();
    const url = `https://github.com/${user}/${repo}`;

    await retry(async context => {
        // get the launch page and follow the path

        const startResult = await request({
            url: `${baseUrl}/launch?template=${url}`,
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
                uri: resultsUrl,
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

export { deployCheck };
