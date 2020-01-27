import { deployCheckMulti } from './../helpers/deployCheck';
import { sfdxTimeout } from './../helpers/testingUtils';
import { testRepos } from '../helpers/testRepos';

test(
    'deploy the first two orgs from testRepos',
    async () => {
        await deployCheckMulti(
            Object.keys(testRepos)
                .flatMap(key => testRepos[key])
                .slice(0, 2)
        );
    },
    sfdxTimeout
);
