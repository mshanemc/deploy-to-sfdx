"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request-promise-native");
const herokuDelete = async (appName) => {
    const headers = {
        Accept: 'application/vnd.heroku+json; version=3',
        Authorization: `Bearer ${process.env.HEROKU_API_KEY}`
    };
    const deleteResult = await request.delete({
        url: `https://api.heroku.com/apps/${appName}`,
        headers,
        json: true
    });
    return deleteResult;
};
exports.herokuDelete = herokuDelete;
