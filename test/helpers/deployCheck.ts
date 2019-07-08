import * as fs from 'fs-extra';
import * as request from 'request-promise-native';

import { getTestURL } from './../helpers/testingUtils';
import { sfdxTimeout } from './../helpers/testingUtils';
import { cdsDelete } from './../../src/lib/redisNormal';
import { CDS } from './../../src/lib/CDS';

import { execProm } from '../../src/lib/execProm';
import { sleep } from '@lifeomic/attempt';

const deployCheck = async (user: string, repo: string) => {
    await fs.ensureDir('tmp');

    const baseUrl = getTestURL();
    const url = `https://github.com/${user}/${repo}`;

    // fetch get the launch page

    const startResult = await request({
        url: `${baseUrl}/launch?template=${url}`,
        resolveWithFullResponse: true
    });

    // console.log(startResult.req.path);
    const deployId = startResult.req.path.replace('/deploying/deployer/', '');
    // console.log(deployId);
    const resultsUrl = `${baseUrl}/results/${deployId}`;
    console.log(resultsUrl);
    // expect the deploying page redirect.  Get its url so we can check its results by id

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

    expect(status.complete).toBe(true);
    expect(status.errors).toHaveLength(0);
    expect(status.mainUser.username).toBeTruthy();
    expect(status.orgId).toBeTruthy();
    expect(status.expirationDate).toBeTruthy();

    await cdsDelete(deployId);
    return status;
};

export { deployCheck };
