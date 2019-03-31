import { poolBuild } from '../lib/poolBuild';

(async () => {
	await poolBuild();
	process.exit(0);
})();