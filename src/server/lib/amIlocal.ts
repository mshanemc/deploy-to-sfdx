const isLocal = (): boolean => process.cwd() !== '/app';

export { isLocal };
