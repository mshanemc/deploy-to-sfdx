import { checkExpiration } from '../../lib/skimmerSupport';
import { CDS } from './../../lib/CDS';
import { redis } from './../../lib/redisNormal';
import moment from 'moment';

const fineOrg = new CDS({
    deployId: `test-1234`,
    complete: true,
    completeTimestamp: new Date()
});

describe("tests the skimmer's expiration checks", () => {
    test('handles empty pool', async () => {
        await redis.del('mshanemc.notapool');
        const result = await checkExpiration({
            lifeHours: 12,
            quantity: 4,
            repos: [
                {
                    username: 'mshanemc',
                    repo: 'notapool'
                }
            ]
        });
        expect(result).toBe(`pool mshanemc.notapool is empty`);
        await redis.del('mshanemc.notapool');
    });

    test('handles pool where all are ok', async () => {
        // create a pool of stuff
        await redis.del('mshanemc.finepool');

        const orgs: CDS[] = new Array(5).fill(fineOrg, 0, 5);
        expect(orgs.length).toBe(5);

        const messages = orgs.map(org => JSON.stringify(org));

        await redis.rpush('mshanemc.finepool', ...messages);
        const result = await checkExpiration({
            lifeHours: 12,
            quantity: 4,
            repos: [
                {
                    username: 'mshanemc',
                    repo: 'finepool'
                }
            ]
        });
        expect(result).toBe(`all the orgs in pool mshanemc.finepool are fine`);
        await redis.del('mshanemc.finepool');
    });

    test('handles pool with expired orgs', async () => {
        // create a pool of stuff
        await redis.del('mshanemc.mixedpool');
        const orgs: CDS[] = new Array(3).fill(fineOrg);

        expect(orgs.length).toBe(3);

        const badOrg = new CDS({
            completeTimestamp: moment()
                .subtract(5, 'days')
                .toDate(),
            deployId: `test-1234`,
            complete: true,
            mainUser: {
                username: 'testusername@salesforce.com',
                loginUrl: 'x'
            }
        });

        orgs.push(badOrg);
        orgs.push(badOrg);
        expect(orgs.length).toBe(5);

        const messages = orgs.map(org => JSON.stringify(org));

        await redis.rpush('mshanemc.mixedpool', ...messages);
        const result = await checkExpiration({
            lifeHours: 12,
            quantity: 4,
            repos: [
                {
                    username: 'mshanemc',
                    repo: 'mixedpool'
                }
            ]
        });
        expect(result).toBe(`queueing for deletion 2 expired orgs from pool mshanemc.mixedpool`);
        await redis.del('mshanemc.mixedpool');
    });
});
