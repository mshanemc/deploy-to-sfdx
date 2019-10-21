const isLocal = (): boolean => {
    return process.cwd() !== '/app';
};

export { isLocal };