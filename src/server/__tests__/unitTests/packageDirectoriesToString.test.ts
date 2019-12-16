import { getPackageDirsFromFile } from '../../lib/namedUtilities';
import { ProjectJSON } from '../../lib/types';

const project: ProjectJSON = {
    packageDirectories: [
        {
            path: 'force-app',
            default: true,
            package: 'electronBranding',
            versionName: 'ver 0.1',
            versionNumber: '0.3.0.NEXT'
        },
        {
            path: 'implementation'
        }
    ],
    namespace: '',
    sfdcLoginUrl: 'https://login.salesforce.com',
    sourceApiVersion: '48.0',
    packageAliases: {
        electronBranding: '0Ho6A000000k9ddSAA',
        'electronBranding@0.2.0-1': '04t6A000002zgJ0QAI',
        'electronBranding@0.3.0-1': '04t6A000002zgKSQAY'
    }
};

test('gets path from an org open command', () => {
    const result = getPackageDirsFromFile(project);
    expect(result).toBe('force-app,implementation');
});
