import { poolBuild } from '../lib/poolBuild';

(async () => {
    let builtSomething = true;
    // keep hitting it until the queue is empty...save saves the whole dyno startup time
    while (builtSomething) {
        builtSomething = await poolBuild();
    }
    process.exit(0);
})();
