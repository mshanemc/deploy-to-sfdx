import {checkExpiration}  from '../../src/lib/skimmerSupport';
import { clientDataStructure } from './../../src/lib/types';
import { redis } from './../../src/lib/redisNormal';
import * as moment from 'moment';

const fineOrg: clientDataStructure = {
    completeTimestamp: new Date(),
    deployId: `test-1234`,
    complete: true,
    errors: [],
    commandResults: []
}

describe('tests the skimmer\'s expiration checks', () => {
    test('handles empty pool', async () => {
        await redis.del('mshanemc.notapool');
        const result = await checkExpiration({
            user: 'mshanemc',
            repo: 'notapool',
            lifeHours: 12,
            quantity: 4
        });
        expect(result).toBe(`pool mshanemc.notapool is empty`);
    });

    test('handles pool where all are ok', async () => {
        // create a pool of stuff
        await redis.del('mshanemc.finepool');
        
        const orgs: clientDataStructure[] = new Array(5).fill(fineOrg, 0, 5);
        expect(orgs.length).toBe(5);

        const messages = orgs.map( org => JSON.stringify(org));
        
        await redis.rpush('mshanemc.finepool', ...messages);
        const result = await checkExpiration({
            user: 'mshanemc',
            repo: 'finepool',
            lifeHours: 12,
            quantity: 4
        });
        expect(result).toBe(`all the orgs in pool mshanemc.finepool are fine`);

    });

    test('handles pool with expired orgs', async () => {
        // create a pool of stuff
        await redis.del('mshanemc.mixedpool');
        let orgs: clientDataStructure[] = new Array(3).fill(fineOrg);

        expect(orgs.length).toBe(3);

        const badOrg: clientDataStructure = {
            completeTimestamp: moment().subtract(5, 'days').toDate(),
            deployId: `test-1234`,
            complete: true,
            errors: [],
            commandResults: [],
            mainUser: {
                username: 'testusername@salesforce.com',
                loginUrl: 'x'
            }
        };

        orgs.push(badOrg);
        orgs.push(badOrg);
        expect(orgs.length).toBe(5);

        const messages = orgs.map( org => JSON.stringify(org));
        
        await redis.rpush('mshanemc.mixedpool', ...messages);
        const result = await checkExpiration({
            user: 'mshanemc',
            repo: 'mixedpool',
            lifeHours: 12,
            quantity: 4
        });
        expect(result).toBe(`queueing for deletion 2 expired orgs from pool mshanemc.mixedpool`);

    });
});
