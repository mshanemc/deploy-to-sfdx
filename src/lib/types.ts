import * as ua from 'universal-analytics';

export interface deployMessage {
  username?: string;
  repo: string;
  pool?: boolean;
  whitelisted?: boolean;
  deployId: string;
  branch?: string;
}

export interface deployRequest extends deployMessage {
  path?: string;
  template: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  visitor?: ua.Visitor;
  delete?: boolean;
}

export interface poolRequest extends deployMessage {

}

export interface poolOrg {
  createdDate: Date;
  repo: string;
  githubUsername: string;
  openCommand: string;
  passwordCommand?: string;
  branch?:string;

  displayResults: {

  }
}

export interface lineParserResult {
  openLine?: string;
  passwordLine?: string;
}

export interface clientDataStructure {

  deployId: string;
  complete: boolean;

  completeTimestamp?: Date;
  browserStartTime?: Date;
  orgId?: string;

  mainUser?: {
    username: string;
    password?: string;
    loginUrl: string;
  }

  additionalUsers?: additionalUser[];
  errors?: clientError[];
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