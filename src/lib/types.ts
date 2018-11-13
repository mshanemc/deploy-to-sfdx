interface deployMessage {
  username?: string;
  repo: string;
  pool?: boolean;
  whitelisted?: boolean;
  deployId: string;
  branch?: string;
}

interface deployRequest extends deployMessage {
  path?: string;
  template: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  delete?: boolean;
}

interface poolRequest extends deployMessage {

}

interface poolOrg {
  createdDate: Date;
  repo: string;
  githubUsername: string;
  openCommand: string;
  passwordCommand?: string;
  branch?:string;

  displayResults: {

  }
}

interface lineParserResult {
  openLine?: string;
  passwordLine?: string;
}