"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heroku_logger_1 = __importDefault(require("heroku-logger"));
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
            heroku_logger_1.default.debug(`checking whitelist 2 element: ${repo}`);
            if (repo.trim().split('/')[0] === ghuser && repo.trim().split('/')[1] === ghrepo) {
                return true;
            }
        }
    }
    return false;
};
exports.checkWhitelist = checkWhitelist;
