import {checkExpiration}  from '../../src/lib/skimmerSupport';
import { poolOrg } from './../../src/lib/types';
import { redis } from './../../src/lib/redisNormal';
import * as moment from 'moment';

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
        const orgs: poolOrg[] = new Array(5).fill({
            githubUsername: 'mshanemc',
            repo: 'finepool',
            createdDate: new Date(),
            openCommand: 'nope'
        }, 0, 5);
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
        let orgs: poolOrg[] = new Array(3).fill({
            githubUsername: 'mshanemc',
            repo: 'mixedpool',
            createdDate: new Date(),
            openCommand: 'nope'
        });
        expect(orgs.length).toBe(3);
        const badOrg:poolOrg = {
            githubUsername: 'mshanemc',
            repo: 'mixedpool',
            createdDate: moment().subtract(5, 'days').toDate(),
            openCommand: 'nope',
            displayResults: {
                id: 'nope',
                username: 'mshanemc'
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
        expect(result).toBe(`removing 2 expired orgs from pool mshanemc.mixedpool`);

    });
});
