import * as ua from 'universal-analytics';

// list of repos used for testing.  See testRepos.ts
export interface TestRepo {
    username: string;
    repo: string;
    branch?: string;
    testPool?: boolean;
}

export interface DeleteRequest {
    delete: boolean;
    username: string;
    created?: Date;
}

export interface DeployRequest {
    repo: string;
    createdTimestamp: Date;
    deployId: string;
    username?: string;
    pool?: boolean;
    whitelisted?: boolean;
    branch?: string;
    path?: string;
    template?: string;
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
}

// tells how a pool should be built.  Used in an array from a url like POOLCONFIG_URL=https://deployer-pools.herokuapp.com/pools-dev
export interface PoolConfig {
    user: string;
    repo: string;
    lifeHours: number;
    quantity: number;
    branch?: string;
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
