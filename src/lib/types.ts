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

export interface clientDataStructure {

  deployId: string;
  complete: boolean;

  completeTimestamp?: Date;
  browserStartTime?: Date;

  mainUser?: {
    username: string;
    password?: string;
    loginUrl: string;
  }

  additionalUsers?: [{
    username: string;
    password: string;
  }];

  errors?: [{
    command: string;
    error: any;
  }];

  commandResults: [{
    command: string;
    summary?: string; // ex: instead of outputting all the apex class stuff, just summarize that apex was executed.
    raw: string; // goes to logs
  }];

}