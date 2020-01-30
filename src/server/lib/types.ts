import * as ua from 'universal-analytics';

// list of repos used for testing.  See testRepos.ts
export interface TestRepo extends DeployRequestRepo {
    testPool?: boolean;
}

export interface DeleteRequest {
    delete: boolean;
    username: string;
    created?: Date;
}

export interface DeployRequest {
    createdTimestamp: Date;
    deployId: string;
    pool?: boolean;
    email?: string;
    firstname?: string;
    lastname?: string;
    visitor?: ua.Visitor;
    byoo?: {
        accessToken: string;
        instanceUrl: string;
        username: string;
        orgId: string;
    };
    repos?: DeployRequestRepo[]; // new version to hold multiples, support more sources
}

export interface DeployRequestRepo {
    source?: string; // defaults to github for now
    username: string;
    repo: string;
    branch?: string;
    whitelisted?: boolean;
}

// tells how a pool should be built.  Used in an array from a url like POOLCONFIG_URL=https://deployer-pools.herokuapp.com/pools-dev
export interface PoolConfig {
    lifeHours: number;
    quantity: number;
    repos?: DeployRequestRepo[];
}

export interface PoolConfigDeprecated extends PoolConfig {
    user?: string; // deprecated.  Use repos for multi
    repo?: string; // deprecated.  Use repos for multi
    branch?: string; // deprecated.  Use repos for multi
}

export interface SfdxDisplayResult {
    username: string;
    id: string;
    instanceUrl?: string;
    expirationDate?: Date;
}

// result of force:org:open --json
export interface OpenResult {
    status: number;
    result: {
        url: string;
        orgId: string;
        username: string;
    };
}

export interface LineParserResult {
    openLine?: string;
}

// devcenter.heroku.com/articles/platform-api-reference#dyno
export interface HerokuDyno {
    type: string;
    created_at: Date;
    id: string;
    command: string;
}

export interface ProjectJSON {
    packageDirectories: PackageDirectory[];
    namespace?: string;
    sfdcLoginUrl?: string;
    sourceApiVersion?: string;
    packageAliases?: { [key: string]: string };
}

interface PackageDirectory {
    path: string;
    default?: boolean;
    package?: string;
    versionName?: string;
    versionNumber?: string;
}

export interface ScratchDef {
    orgName?: string;
    description?: string;
    features?: string[];
    template?: string;
    edition?: string;
    username?: string;
    // tslint:disable-next-line: no-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings?: { [key: string]: any };
}
