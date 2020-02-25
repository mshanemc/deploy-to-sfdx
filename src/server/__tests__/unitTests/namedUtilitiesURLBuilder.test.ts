import { multiTemplateURLBuilder } from '../../lib/multiTemplateURLBuilder';

describe('argStripperTest', () => {
    // const cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
    const templates = [`https://github.com/mshanemc/df17IntegrationWorkshops`, 'https://github.com/mshanemc/codeForClicks'];

    test('single template', () => {
        expect(multiTemplateURLBuilder([templates[0]])).toBe('?template=https://github.com/mshanemc/df17IntegrationWorkshops');
    });

    test('single template', () => {
        expect(multiTemplateURLBuilder(templates)).toBe(
            '?template=https://github.com/mshanemc/df17IntegrationWorkshops&template=https://github.com/mshanemc/codeForClicks'
        );
    });

    test('with preQueryURL', () => {
        expect(multiTemplateURLBuilder(templates, '/launch')).toBe(
            '/launch?template=https://github.com/mshanemc/df17IntegrationWorkshops&template=https://github.com/mshanemc/codeForClicks'
        );
    });
});
