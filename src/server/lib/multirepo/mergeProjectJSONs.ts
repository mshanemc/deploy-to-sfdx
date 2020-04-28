import { ProjectJSON } from '../types';

const MergeProjectJSONs = ({ projectJSONs, localFilePaths }): ProjectJSON => {
    const output: ProjectJSON = {
        namespace: '',
        packageDirectories: []
    };

    // put the files in {path: file} format
    const mappedFiles = projectJSONs.reduce((resultingObject, file, index) => ({ ...resultingObject, [localFilePaths[index]]: file }), {});

    // enhancement 0: no defaults since they might collide, except 1st one because there has to be one
    for (const path in mappedFiles) {
        for (const dir of mappedFiles[path].packageDirectories) {
            output.packageDirectories.push({ path: `${path}/${dir.path}` });
        }
    }
    output.packageDirectories[0].default = true;

    // enhancement 1: max api version if one exists
    const maxApiVersion = Math.max(
        ...projectJSONs
            .map((pj) => pj.sourceApiVersion)
            .filter((version) => version) // filter out undefineds
            .map((version) => parseFloat(version))
    );
    if (Number.isInteger(maxApiVersion)) {
        output.sourceApiVersion = maxApiVersion + '.0';
    }

    return output;
};

export { MergeProjectJSONs };
