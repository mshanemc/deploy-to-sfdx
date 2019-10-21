"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_native_1 = __importDefault(require("request-promise-native"));
const heroku_logger_1 = __importDefault(require("heroku-logger"));
const herokuDelete = async (appName) => {
    const headers = {
        Accept: 'application/vnd.heroku+json; version=3',
        Authorization: `Bearer ${process.env.HEROKU_API_KEY}`
    };
    try {
        const deleteResult = await request_promise_native_1.default.delete({
            url: `https://api.heroku.com/apps/${appName}`,
            headers,
            json: true
        });
        return deleteResult;
    }
    catch (e) {
        heroku_logger_1.default.error(`error deleting heroku app ${appName}`);
    }
};
exports.herokuDelete = herokuDelete;
