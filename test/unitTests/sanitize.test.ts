/* globals describe */
import { filterAlphaHypenUnderscore } from '../../src/lib/shellSanitize';

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
        expect( () => { filterAlphaHypenUnderscore(input)}).toThrow();
    });
    
});