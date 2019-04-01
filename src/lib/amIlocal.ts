import * as fs from 'fs-extra';

const isLocal = () => {
    // return ! (  fs.existsSync('/app') );
    return process.cwd() === '/app'
};

export { isLocal };