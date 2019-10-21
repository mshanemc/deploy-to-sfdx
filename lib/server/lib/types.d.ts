import * as ua from 'universal-analytics';
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
export interface herokuDyno {
    type: string;
    created_at: Date;
    id: string;
    command: string;
}
