"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkWhitelist = (ghuser, ghrepo) => {
    const whitelist1 = process.env.GITHUB_USERNAME_WHITELIST;
    const whitelist2 = process.env.GITHUB_REPO_WHITELIST;
    if (!whitelist1 && !whitelist2) {
        return false;
    }
    if (whitelist1) {
        for (const username of whitelist1.split(',')) {
            if (username.trim() === ghuser) {
                return true;
            }
        }
    }
    if (whitelist2) {
        for (const repo of whitelist2.split(',')) {
            if (repo.trim().split('/')[0] === ghuser && repo.trim().split('/')[1] === ghrepo) {
                return true;
            }
        }
    }
    return false;
};
exports.checkWhitelist = checkWhitelist;
