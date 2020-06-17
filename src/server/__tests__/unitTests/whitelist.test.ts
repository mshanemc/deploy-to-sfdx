process.env.GITHUB_USERNAME_WHITELIST = 'mshanemc';
process.env.GITHUB_REPO_WHITELIST = 'notme/something';
process.env.POOLCONFIG_URL = 'https://url.com';

import { mocked } from 'ts-jest/utils';

import { getPoolConfig } from '../../lib/namedUtilities';
import { checkWhitelist } from '../../lib/checkWhitelist';
import { PoolConfig } from '../../lib/types';

// mock the pool url so whitelist 3 runs
jest.mock('../../lib/namedUtilities');
const mockedGetPoolConfig = mocked(getPoolConfig, true);
const resp: PoolConfig[] = [{ lifeHours: 1, quantity: 1, repos: [{ username: 'testusername', repo: 'testrepo' }] }];
mockedGetPoolConfig.mockResolvedValue(resp);

test('verifies username is whitelisted', async () => {
    expect(process.env.GITHUB_USERNAME_WHITELIST).toBe('mshanemc');
    expect(await checkWhitelist('mshanemc', 'anyrepo')).toBe(true);
});

test('verifies username is not whitelisted', async () => {
    expect(process.env.GITHUB_USERNAME_WHITELIST).toBe('mshanemc');
    expect(await checkWhitelist('notme', 'anyrepo')).toBe(false);
});

test('verifies repo when whitelisted', async () => {
    expect(await checkWhitelist('notme', 'something')).toBe(true);
});

test('verifies repo whitelisted but not username', async () => {
    expect(await checkWhitelist('someoneelse', 'something')).toBe(false);
});

test('verifies repo from poolConfig', async () => {
    expect(await checkWhitelist('testusername', 'testrepo')).toBe(true);
});
