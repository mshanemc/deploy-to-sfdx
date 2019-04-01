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
  branch?: string;path?: string;
  template?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  visitor?: ua.Visitor;
  delete?: boolean;
}

// tells how a pool should be built.  Used in an array from a url like POOLCONFIG_URL=https://deployer-pools.herokuapp.com/pools-dev
export interface poolConfig {
  user: string;
  repo: string;
  lifeHours: number;
  quantity: number;
}

// an org that's already built
export interface poolOrg {
  createdDate: Date;
  repo: string;
  githubUsername: string;
  openCommand: string;
  passwordCommand?: string;
  branch?: string;
  displayResults?: sfdxDisplayResult;
}

interface sfdxDisplayResult {
  username: string;
  id: string;
  instanceUrl?: string;
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

// emitted to the messages page via websocket.  Structure drives the vue app on the client
export interface clientDataStructure {
  deployId: string;
  complete: boolean;

  completeTimestamp?: Date; // when the job completed
  browserStartTime?: Date; // when the job began
  openTimestamp?: Date; // when the open button became visible, even if more scripts were still running
  buildStartTime?: Date;

  orgId?: string;

  mainUser?: {
    username: string;
    loginUrl: string;
    password?: string;
  };

  additionalUsers?: additionalUser[];
  errors: clientError[];
  commandResults: clientResult[];
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

// devcenter.heroku.com/articles/platform-api-reference#dyno
export interface herokuDyno {
  type: string;
  created_at: Date;
  id: string;
  command: string;
}

export interface NightmarePage {
  url ?: string;
}

