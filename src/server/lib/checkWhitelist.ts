// import logger from 'heroku-logger';
import { processWrapper } from './processWrapper';

// checking for whitelisting
const checkWhitelist = (ghuser: string, ghrepo: string): boolean => {
    const whitelist1 = processWrapper.GITHUB_USERNAME_WHITELIST; // comma separated list of username
    const whitelist2 = processWrapper.GITHUB_REPO_WHITELIST; // comma separated list of username/repo

    if (!whitelist1 && !whitelist2) {
        // logger.debug('no whitelists, returning early');

        return false;
    }

    if (whitelist1) {
        for (const username of whitelist1.split(',')) {
            if (username.trim().toLowerCase() === ghuser.toLowerCase()) {
                // logger.debug(`matched ${username} and ${ghuser}`);
                return true;
            }
            // logger.debug(` not matched ${username} and ${ghuser}`);
        }
    }

    if (whitelist2) {
        for (const repo of whitelist2.split(',')) {
            // logger.debug(`checking whitelist 2 element: ${repo}`);
            if (
                repo
                    .trim()
                    .split('/')[0]
                    .toLowerCase() === ghuser.toLowerCase() &&
                repo
                    .trim()
                    .split('/')[1]
                    .toLowerCase() === ghrepo.toLowerCase()
            ) {
                return true;
            }
        }
    }

    return false;
};

export { checkWhitelist };
