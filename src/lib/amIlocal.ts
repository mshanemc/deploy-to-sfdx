const isLocal = () => {
    // return ! (  fs.existsSync('/app') );
    console.log(process.cwd());
    return process.cwd() === '/app';
    // return false;
};

export { isLocal };