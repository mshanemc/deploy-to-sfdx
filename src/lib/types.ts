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