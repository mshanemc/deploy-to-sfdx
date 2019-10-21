import { lineParserResult } from './types';
declare class CDS {
    deployId: string;
    complete: boolean;
    completeTimestamp?: Date;
    browserStartTime?: Date;
    openTimestamp?: Date;
    buildStartTime?: Date;
    poolBuildFinishTime?: Date;
    poolBuildStartTime?: Date;
    lineCount?: Number;
    orgId?: string;
    instanceUrl?: string;
    expirationDate?: Date;
    mainUser?: {
        username?: string;
        loginUrl?: string;
        password?: string;
    };
    additionalUsers: additionalUser[];
    errors: clientError[];
    commandResults: clientResult[];
    herokuResults: HerokuResult[];
    currentCommand: string;
    poolLines?: lineParserResult;
    isPool: boolean;
    constructor(options: CDSOptions);
}
export interface HerokuResult {
    appName: string;
    dashboardUrl: string;
    openUrl: string;
}
export interface CDSOptions {
    deployId: string;
    complete?: boolean;
    completeTimestamp?: Date;
    browserStartTime?: Date;
    openTimestamp?: Date;
    buildStartTime?: Date;
    poolBuildFinishTime?: Date;
    poolBuildStartTime?: Date;
    lineCount?: Number;
    orgId?: string;
    instanceUrl?: string;
    expirationDate?: Date;
    mainUser?: {
        username: string;
        loginUrl: string;
        password?: string;
    };
    additionalUsers?: additionalUser[];
    errors?: clientError[];
    commandResults?: clientResult[];
    herokuResults?: HerokuResult[];
    currentCommand?: string;
    poolLines?: lineParserResult;
    isPool?: boolean;
}
interface clientError {
    command: string;
    error: string;
    raw: any;
}
interface clientResult {
    command: string;
    summary?: commandSummary;
    shortForm?: string;
    raw: string;
}
interface additionalUser {
    username: string;
    password?: string;
}
export declare enum commandSummary {
    HEROKU_DEPLOY = "deploying a heroku app",
    OPEN = "opening org",
    PASSWORD_GEN = "generating a password",
    ORG_CREATE = "creating an org",
    PUSH = "pushing source",
    APEX_EXEC = "executing some apex",
    PERMSET = "assigning a permset",
    DATA = "loading some data",
    USER_CREATE = "creating a user",
    PACKAGE = "installing a package",
    DEPLOY = "deploying via metadata api"
}
export { CDS };
