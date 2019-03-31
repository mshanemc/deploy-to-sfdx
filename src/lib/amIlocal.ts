import * as fs from 'fs-extra';

const isLocal = () => {
    return ! ( fs.existsSync('/app') );
};

export { isLocal };