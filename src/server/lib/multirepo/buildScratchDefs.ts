import merge = require('deepmerge');
import { ScratchDef } from '../types';

const fieldInfo = {
    willExistFromOverwrite: ['orgName', 'description'],
    mightExistDontMatter: ['adminEmail'],
    anyTrueMakesTrue: ['hasSampleData'],
    mustAgreeOrBeUndefined: ['language', 'country', 'template', 'edition']
};

const featureMerge = (files: ScratchDef[]): string[] => {
    const features = files.map((file) => file.features);
    const featuresInAnArray = []
        .concat(...features)
        .filter((feature) => feature)
        .map((feature) => feature.toLowerCase());
    return [...new Set(featuresInAnArray)];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mustAgreeOrBeUndefined = (files: ScratchDef[], itemName: string): any[] => {
    const itemsDefined = files.map((file) => file[itemName]).filter((item) => item);
    if (new Set(itemsDefined).size > 1) {
        throw new Error(`the repos have conflicting values for ${itemName}`);
    }
    return itemsDefined[0];
};

const buildScratchDef = ({ repoFileJSONs, projectname }): ScratchDef => {
    const output: ScratchDef = {
        orgName: projectname
    };

    // SUPER NAIVE IMPLEMENTATION, to be corrected below
    const simpleMerge: ScratchDef = merge.all([...repoFileJSONs, output], {});

    // enhancement 0: disallow orgPreferenceSettings
    repoFileJSONs.forEach((repo) => {
        if (repo.settings.orgPreferenceSettings) {
            throw new Error('orgPreferenceSettings is not allowed!');
        }
    });
    // enhancement 1: if anyone is using sampleData, it'll be there
    fieldInfo.anyTrueMakesTrue.forEach((item) => (simpleMerge[item] = repoFileJSONs.some((repo) => repo[item])));

    // enhancement 2: merge/dedupe the features list
    simpleMerge.features = featureMerge(repoFileJSONs);
    // enhancement 3: some fields have to agree OR all be undefined
    fieldInfo.mustAgreeOrBeUndefined.forEach((item) => (simpleMerge[item] = mustAgreeOrBeUndefined(repoFileJSONs, item)));
    // enhancement 4: if template, then no edition
    if (simpleMerge.template) {
        delete simpleMerge.edition;
    }
    // enhancement 5: never username
    if (simpleMerge.username) {
        delete simpleMerge.username;
    }
    return simpleMerge;
};

export { buildScratchDef, fieldInfo, featureMerge };
