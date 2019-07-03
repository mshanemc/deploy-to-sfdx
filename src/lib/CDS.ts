// implement all the member structures

// constructor with just deployId, optional timestamp

// constructor that takes an existing CDS (from deserialization, for example)

// methods?
// publish timestamps
import { lineParserResult } from './types';

class CDS {
    deployId: string;
    complete: boolean;

    completeTimestamp?: Date; // when the job completed
    browserStartTime?: Date; // when the job began
    openTimestamp?: Date; // when the open button became visible, even if more scripts were still running
    buildStartTime?: Date;

    lineCount?: Number; // how many lines need to run...used for status bar

    orgId?: string;
    instanceUrl?: string;

    mainUser?: {
        username?: string;
        loginUrl?: string;
        password?: string;
    };

    additionalUsers: additionalUser[];
    errors: clientError[];
    commandResults: clientResult[];
    herokuResults: HerokuResult[];
    poolLines?: lineParserResult;

    constructor(options: CDSOptions) {
        this.deployId = options.deployId;
        this.complete = options.complete || false;

        this.completeTimestamp = options.completeTimestamp;
        this.browserStartTime = options.browserStartTime = new Date();
        this.openTimestamp = options.openTimestamp;
        this.buildStartTime = options.buildStartTime || new Date();

        this.lineCount = options.lineCount || 50;

        this.orgId = options.orgId;
        this.instanceUrl = options.instanceUrl;
        this.mainUser = options.mainUser || {};

        this.additionalUsers = options.additionalUsers || [];
        this.errors = options.errors || [];
        this.commandResults = options.commandResults || [];
        this.herokuResults = options.herokuResults || [];
        this.poolLines = options.poolLines;
    }
}

export interface HerokuResult {
    appName: string;
    dashboardUrl: string;
    openUrl: string;
}

export interface CDSOptions {
    deployId: string;
    complete?: boolean;

    completeTimestamp?: Date; // when the job completed
    browserStartTime?: Date; // when the job began
    openTimestamp?: Date; // when the open button became visible, even if more scripts were still running
    buildStartTime?: Date;

    lineCount?: Number; // how many lines need to run...used for status bar

    orgId?: string;
    instanceUrl?: string;

    mainUser?: {
        username: string;
        loginUrl: string;
        password?: string;
    };

    additionalUsers?: additionalUser[];
    errors?: clientError[];
    commandResults?: clientResult[];
    herokuResults?: HerokuResult[];
    poolLines?: lineParserResult;
}

interface clientError {
    command: string;
    error: string;
    raw: any;
}

interface clientResult {
    command: string;
    summary?: commandSummary; // ex: instead of outputting all the apex class stuff, just summarize that apex was executed.
    shortForm?: string;
    raw: string; // goes to logs
}

interface additionalUser {
    username: string;
    password?: string;
}

// definitions used for parsing the messages from common commands to a more user friendly format
export enum commandSummary {
    HEROKU_DEPLOY = 'deploying a heroku app',
    OPEN = 'opening org',
    PASSWORD_GEN = 'generating a password',
    ORG_CREATE = 'creating an org',
    PUSH = 'pushing source',
    APEX_EXEC = 'executing some apex',
    PERMSET = 'assigning a permset',
    DATA = 'loading some data',
    USER_CREATE = 'creating a user',
    PACKAGE = 'installing a package',
    DEPLOY = 'deploying via metadata api'
}

export { CDS };
