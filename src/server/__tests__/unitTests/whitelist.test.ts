process.env.GITHUB_USERNAME_WHITELIST = 'mshanemc';
process.env.GITHUB_REPO_WHITELIST = 'notme/something';

import { checkWhitelist } from '../../lib/checkWhitelist';

test('verifies username is whitelisted', () => {
    expect(process.env.GITHUB_USERNAME_WHITELIST).toBe('mshanemc');
    expect(checkWhitelist('mshanemc', 'anyrepo')).toBe(true);
});

test('verifies username is not whitelisted', () => {
    expect(process.env.GITHUB_USERNAME_WHITELIST).toBe('mshanemc');
    expect(checkWhitelist('notme', 'anyrepo')).toBe(false);
});

test('verifies repo when whitelisted', () => {
    expect(checkWhitelist('notme', 'something')).toBe(true);
});

test('verifies repo whitelisted but not username', () => {
    expect(checkWhitelist('someoneelse', 'something')).toBe(false);
});
