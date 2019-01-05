import { poolBuild } from './poolBuild';

poolBuild()
.then( (builtAnOrg:boolean) => {
	process.exit(0);
});
