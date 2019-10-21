import * as ua from 'universal-analytics';

// list of repos used for testing.  See testRepos.ts
export interface testRepo {
    username: string;
    repo: string;
}

export interface DeleteRequest {
    delete: boolean;
    username: string;
}

export interface deployRequest {
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
}

// tells how a pool should be built.  Used in an array from a url like POOLCONFIG_URL=https://deployer-pools.herokuapp.com/pools-dev
export interface poolConfig {
    user: string;
    repo: string;
    lifeHours: number;
    quantity: number;
    branch?: string;
}

export interface sfdxDisplayResult {
    username: string;
    id: string;
    instanceUrl?: string;
    expirationDate?: Date;
}

// result of force:org:open --json
export interface openResult {
    status: number;
    result: {
        url: string;
        orgId: string;
        username: string;
    };
}

export interface lineParserResult {
    openLine?: string;
    passwordLine?: string;
}

// devcenter.heroku.com/articles/platform-api-reference#dyno
export interface herokuDyno {
    type: string;
    created_at: Date;
    id: string;
    command: string;
}
