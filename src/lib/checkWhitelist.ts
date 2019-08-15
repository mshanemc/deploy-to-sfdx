import * as logger from 'heroku-logger';

// checking for whitelisting
const checkWhitelist = (ghuser: string, ghrepo: string) => {
    const whitelist1 = process.env.GITHUB_USERNAME_WHITELIST; // comma separated list of username
    const whitelist2 = process.env.GITHUB_REPO_WHITELIST; // comma separated list of username/repo

    // logger.warn(`whitelist is ${whitelist1}`);

    if (!whitelist1 && !whitelist2) {
        // logger.debug('no whitelists, returning early');

        return false;
    }

    if (whitelist1) {
        for (const username of whitelist1.split(',')) {
            if (username.trim() === ghuser) {
                // logger.debug(`matched ${username} and ${ghuser}`);
                return true;
            }
            // logger.debug(` not matched ${username} and ${ghuser}`);
        }
    }

    if (whitelist2) {
        for (const repo of whitelist2.split(',')) {
            logger.debug(`checking whitelist 2 element: ${repo}`);
            if (repo.trim().split('/')[0] === ghuser && repo.trim().split('/')[1] === ghrepo) {
                return true;
            }
        }
    }

    return false;
};

export { checkWhitelist };
