import { poolBuild } from '../lib/poolBuild';

(async () => {
    let builtSomething = true;
    // keep hitting it until the queue is empty...save saves the whole dyno startup time
    while (builtSomething) {
        // eslint-disable-next-line no-await-in-loop
        builtSomething = await poolBuild();
    }
    // eslint-disable-next-line no-process-exit
    process.exit(0);
})();
