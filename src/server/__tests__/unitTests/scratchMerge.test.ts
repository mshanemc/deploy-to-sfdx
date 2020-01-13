/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { buildScratchDef, featureMerge, fieldInfo } from '../../lib/multirepo/buildScratchDefs';
const projectname = 'ScratchDefMargeTesting';

describe('required fields exist', () => {
    test('parses a repo', () => {
        const result = buildScratchDef({ repoFileJSONs: [file1, file2], projectname });
        for (const item of fieldInfo.willExistFromOverwrite) {
            expect(result).toHaveProperty(item);
        }
        expect(result).toHaveProperty('hasSampleData', true);
        expect(result).toHaveProperty('features');
    });

    test('parses a repo with language', () => {
        const result = buildScratchDef({ repoFileJSONs: [file1, languageCollisionFile1], projectname });
        for (const item of fieldInfo.willExistFromOverwrite) {
            expect(result).toHaveProperty(item);
        }
        expect(result).toHaveProperty('hasSampleData', true);
        expect(result).toHaveProperty('features');
        expect(result).toHaveProperty('language', languageCollisionFile1.language);
    });

    test('gets settings merged', () => {
        const result = buildScratchDef({ repoFileJSONs: [file1, file2], projectname });
        expect(result.settings.communitiesSettings).toHaveProperty('enableNetworksEnabled', false);
        expect(result.settings.securitySettings.passwordPolicies).toHaveProperty('enableSetPasswordInApi', true);
    });

    test('gets 3 settings merged', () => {
        const result = buildScratchDef({ repoFileJSONs: [file3, file2, file1], projectname });
        expect(result.settings.chatterSettings).toHaveProperty('enableChatter', true);
    });
});

describe('mustAgree', () => {
    it('works for not defined', () => {
        expect(buildScratchDef({ repoFileJSONs: [file1, file2], projectname })).toHaveProperty('language', undefined);
    });
    it('works for one defined', () => {
        expect(buildScratchDef({ repoFileJSONs: [file1, languageCollisionFile1], projectname })).toHaveProperty('language', 'Pig Latin');
    });
    it('fails for two defined differently', () => {
        expect(() => buildScratchDef({ repoFileJSONs: [languageCollisionFile1, languageCollisionFile2], projectname })).toThrow();
    });
    it('fails for two nn-matching templates differently', () => {
        expect(() =>
            buildScratchDef({
                repoFileJSONs: [
                    { ...file1, template: 'ABCDEFG', edition: undefined },
                    { ...file2, template: 'ABCDEFGH', edition: undefined }
                ],
                projectname
            })
        ).toThrow();
    });
});

describe('featureMerge', () => {
    test('merges two arrays with no overlap', () => {
        expect(featureMerge([{ features: ['a', 'b'] }, { features: ['c', 'd'] }])).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd']));
    });
    test('merges two array with some overlap', () => {
        expect(featureMerge([{ features: ['a', 'b'] }, { features: ['c', 'b'] }])).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    });
    test('merges with lowercase', () => {
        expect(featureMerge([{ features: ['a', 'B'] }, { features: ['C', 'b'] }])).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    });
    test('merges with undefineds', () => {
        expect(featureMerge([{ features: ['a', 'B'] }, { features: ['C', 'b'] }, { features: undefined }])).toEqual(
            expect.arrayContaining(['a', 'b', 'c'])
        );
    });
});

const file1 = {
    orgName: 'workshops',
    description: 'lwc',
    adminEmail: 'shane@mailinator.com',
    hasSampleData: true,
    edition: 'Developer',
    features: ['Communities'],
    settings: {
        communitiesSettings: {
            enableNetworksEnabled: false
        },
        lightningExperienceSettings: {
            enableS1DesktopEnabled: true
        },
        pathAssistantSettings: {
            pathAssistantEnabled: true
        },
        mobileSettings: {
            enableS1EncryptedStoragePref2: false
        },
        securitySettings: {
            passwordPolicies: {
                enableSetPasswordInApi: true
            }
        }
    }
};

const file2 = {
    orgName: 'workshops',
    edition: 'Developer',
    description: 'Integration Workshops',
    settings: {
        chatterSettings: {
            enableChatter: true
        },
        pathAssistantSettings: {
            pathAssistantEnabled: true
        },
        lightningExperienceSettings: {
            enableS1DesktopEnabled: true
        },
        mobileSettings: {
            enableS1EncryptedStoragePref2: false,
            enableLightningOnMobile: true
        },
        securitySettings: {
            passwordPolicies: {
                enableSetPasswordInApi: true
            }
        }
    },
    hasSampleData: false
};

const file3 = {
    orgName: 'workshops',
    edition: 'Developer',
    description: 'Integration Workshops',
    settings: {
        chatterSettings: {
            enableChatter: false
        },
        pathAssistantSettings: {
            pathAssistantEnabled: true
        },
        lightningExperienceSettings: {
            enableS1DesktopEnabled: true
        },
        mobileSettings: {
            enableS1EncryptedStoragePref2: false,
            enableLightningOnMobile: true
        },
        securitySettings: {
            passwordPolicies: {
                enableSetPasswordInApi: true
            }
        }
    },
    hasSampleData: false
};
const languageCollisionFile1 = { ...file1, language: 'Pig Latin' };
const languageCollisionFile2 = { ...file1, language: 'ParselTongue' };
