/* globals describe */
import { filterAlphaHypenUnderscore, shellSanitize } from '../../lib/shellSanitize';

describe('filterAlphaHypenUnderscore tests', () => {
    test('simple string passes', () => {
        const input = 'mshanemc';
        expect(filterAlphaHypenUnderscore(input)).toBe(input);
    });

    test('string with underscore passes', () => {
        const input = 'mshan_emc';
        expect(filterAlphaHypenUnderscore(input)).toBe(input);
    });

    test('string with hyphen passes', () => {
        const input = 'mshanemc-gsumner';
        expect(filterAlphaHypenUnderscore(input)).toBe(input);
    });

    test('string with @ fails', () => {
        const input = 'mshanemc@gsumner';
        expect(() => {
            filterAlphaHypenUnderscore(input);
        }).toThrow();
    });
});

describe('sanitize tests good', () => {
    test('simple string passes', () => {
        const input = 'this is a fine command';
        expect(shellSanitize(input)).toBe(true);
    });

    test('passes empty', () => {
        expect(shellSanitize('')).toBe(true);
    });
});

describe('sanitize tests bad', () => {
    test('string with underscore passes', () => {
        const input = 'let me pipe | to here';
        expect(() => {
            shellSanitize(input);
        }).toThrow();
    });

    test('string with hyphen passes', () => {
        const input = 'I am > you';
        expect(() => {
            shellSanitize(input);
        }).toThrow();
    });

    test('string with @ fails', () => {
        const input = 'mshanemc && gsumner';
        expect(() => {
            shellSanitize(input);
        }).toThrow();
    });
});
