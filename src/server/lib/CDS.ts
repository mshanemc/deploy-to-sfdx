/* eslint-disable @typescript-eslint/class-name-casing */
import { LineParserResult } from './types';

class CDS {
    deployId: string;
    complete: boolean;

    completeTimestamp?: Date; // when the job completed
    browserStartTime?: Date; // when the deploy was requested by a user
    openTimestamp?: Date; // when the open button became visible, even if more scripts were still running
    buildStartTime?: Date; // when the build started, excluding pool time
    poolBuildFinishTime?: Date; // when the build finished, pools only
    poolBuildStartTime?: Date; // when the build started, pools only

    lineCount?: number; // how many lines need to run...used for status bar

    orgId?: string;
    instanceUrl?: string;
    expirationDate?: Date;

    mainUser?: MainUser;

    additionalUsers: additionalUser[];
    errors: ClientError[];
    commandResults: ClientResult[];
    herokuResults: HerokuResult[];
    currentCommand: string;

    poolLines?: LineParserResult;
    isPool: boolean;
    isByoo: boolean;

    constructor(options: CDSOptions) {
        this.deployId = options.deployId;
        this.complete = options.complete || false;

        this.completeTimestamp = options.completeTimestamp;
        this.browserStartTime = options.browserStartTime = new Date();
        this.openTimestamp = options.openTimestamp;
        this.poolBuildFinishTime = options.poolBuildFinishTime;
        this.poolBuildStartTime = options.poolBuildStartTime;
        this.buildStartTime = options.buildStartTime || new Date();

        this.lineCount = options.lineCount || 50;

        this.orgId = options.orgId;
        this.instanceUrl = options.instanceUrl;
        this.mainUser = options.mainUser || {};
        this.expirationDate = options.expirationDate;

        this.additionalUsers = options.additionalUsers || [];
        this.errors = options.errors || [];
        this.commandResults = options.commandResults || [];
        this.herokuResults = options.herokuResults || [];
        this.currentCommand = options.currentCommand;

        this.poolLines = options.poolLines;
        this.isPool = options.isPool || false;
        this.isByoo = options.isByoo || false;
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
    buildStartTime?: Date; // when the worker took up the build task
    poolBuildFinishTime?: Date;
    poolBuildStartTime?: Date;

    lineCount?: number; // how many lines need to run...used for status bar

    orgId?: string;
    instanceUrl?: string;
    expirationDate?: Date;

    mainUser?: MainUser;

    additionalUsers?: additionalUser[];
    errors?: ClientError[];
    commandResults?: ClientResult[];
    herokuResults?: HerokuResult[];
    currentCommand?: string;

    poolLines?: LineParserResult;
    isPool?: boolean;
    isByoo?: boolean;
}

interface MainUser {
    username?: string;
    loginUrl?: string;
    password?: string;
    openPath?: string;
    permalink?: string;
}

export interface ClientError {
    command: string;
    error: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw: any;
}

export interface ClientResult {
    command: string;
    summary?: commandSummary; // ex: instead of outputting all the apex class stuff, just summarize that apex was executed.
    shortForm?: string;
    raw?: string; // goes to logs
    commandStartTimestamp?: Date;
    commandCompleteTimestamp?: Date;
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
