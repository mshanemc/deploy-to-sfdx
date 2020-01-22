/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */

import { MergeProjectJSONs } from '../../lib/multirepo/mergeProjectJSONs';
import { ProjectJSON } from '../../lib/types';

describe('makes a valid file', () => {
    test('mixes 2 files, basic structure', () => {
        const result = MergeProjectJSONs({
            projectJSONs: [fileSimple, MultiPathsWithDefaults],
            localFilePaths: ['fileSimple', 'MultiPathsWithDefaults']
        });
        expect(result).toHaveProperty('packageDirectories');
        expect(result.sfdcLoginUrl).toBe(undefined);
        expect(result.namespace).toBe('');
    });

    test('mixes files with differing api versions', () => {
        const result = MergeProjectJSONs({
            projectJSONs: [fileSimple, simpleHigherApi],
            localFilePaths: ['fileSimple', 'simpleHigherApi']
        });
        expect(result.sourceApiVersion).toBe('49.0');
    });

    test('mixes files with one missing api versions', () => {
        const result = MergeProjectJSONs({
            projectJSONs: [fileSimple, MultiPathsWithDefaults],
            localFilePaths: ['fileSimple', 'MultiPathsWithDefaults']
        });
        expect(result.sourceApiVersion).toBe('46.0');
    });

    test('mixes files with BOTH missing api versions', () => {
        const result = MergeProjectJSONs({
            projectJSONs: [otherNonAPIVersion, MultiPathsWithDefaults],
            localFilePaths: ['otherNonAPIVersion', 'MultiPathsWithDefaults']
        });
        expect(result.sourceApiVersion).toBe(undefined);
    });

    test('no defaults', () => {
        const result = MergeProjectJSONs({
            projectJSONs: [fileSimple, MultiPathsWithDefaults],
            localFilePaths: ['fileSimple', 'MultiPathsWithDefaults']
        });
        expect(result.packageDirectories[0].default).toBe(true);

        for (const dir of result.packageDirectories.slice(1)) {
            expect(dir.default).toBeFalsy();
        }
    });

    test('gets packageDirs right', () => {
        const result = MergeProjectJSONs({
            projectJSONs: [fileSimple, MultiPathsWithDefaults, simpleHigherApi],
            localFilePaths: ['fileSimple', 'MultiPathsWithDefaults', 'simpleHigherApi']
        });
        expect(result).toHaveProperty('packageDirectories');
        expect(result.packageDirectories.length).toBe(4);
        expect(result.packageDirectories).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: 'fileSimple/force-app' }),
                expect.objectContaining({ path: 'MultiPathsWithDefaults/force-app' }),
                expect.objectContaining({ path: 'MultiPathsWithDefaults/somethingElse' }),
                expect.objectContaining({ path: 'simpleHigherApi/force-app' })
            ])
        );
    });
});

const fileSimple: ProjectJSON = {
    packageDirectories: [{ path: 'force-app' }],
    sourceApiVersion: '46.0'
};

const MultiPathsWithDefaults: ProjectJSON = {
    packageDirectories: [{ path: 'force-app' }, { path: 'somethingElse', default: true }]
};

const simpleHigherApi: ProjectJSON = {
    packageDirectories: [{ path: 'force-app' }],
    sourceApiVersion: '49.0'
};

const otherNonAPIVersion: ProjectJSON = {
    packageDirectories: [{ path: 'force-app' }]
};
