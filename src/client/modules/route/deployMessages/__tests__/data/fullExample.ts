const fullExample = {
  deployId: 'mshanemc-process-automation-workshop-df17-1559757015305',
  currentCommand: 'this is a test command',
  complete: false,
  errors: [
    {
      command: 'this is a test command',
      error: 'this is a test error',
      raw: 'this is a test raw output'
    }
  ],
  commandResults: [
    {
      command:
        'git clone -b master --single-branch https://github.com/mshanemc/process-automation-workshop-df17.git mshanemc-process-automation-workshop-df17-1559715753856',
      raw: "Cloning into 'mshanemc-process-automation-workshop-df17-1559715753856'...\n"
    },
    {
      command: 'sfdx force:org:create -f config/project-scratch-def.json -s -d 1 --json',
      summary: 'creating an org',
      raw: { status: 0, result: { orgId: '00D1F000000ERrxUAG', username: 'test-s0pml3myzddz@example.com' } },
      shortForm: 'created org 00D1F000000ERrxUAG with username test-s0pml3myzddz@example.com'
    },
    {
      command: 'sfdx force:source:push --json',
      summary: 'pushing source',
      raw: {
        status: 0,
        result: {
          pushedSource: [
            {
              state: 'Add',
              fullName: 'unfiled$public/Account_Closed_Legal_Notification',
              type: 'EmailTemplate',
              filePath: 'force-app/main/default/email/unfiled$public/Account_Closed_Legal_Notification.email'
            },
            {
              state: 'Add',
              fullName: 'unfiled$public/Account_Closed_Legal_Notification',
              type: 'EmailTemplate',
              filePath: 'force-app/main/default/email/unfiled$public/Account_Closed_Legal_Notification.email-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'ContactRecruiting',
              type: 'Flow',
              filePath: 'force-app/main/default/flows/ContactRecruiting.flow-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'REFERENCEClosed_Account',
              type: 'Flow',
              filePath: 'force-app/main/default/flows/REFERENCEClosed_Account.flow-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Account-Account Layout',
              type: 'Layout',
              filePath: 'force-app/main/default/layouts/Account-Account Layout.layout-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c-Referral Layout',
              type: 'Layout',
              filePath: 'force-app/main/default/layouts/Referral__c-Referral Layout.layout-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Account.Active__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Account/fields/Active__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c',
              type: 'CustomObject',
              filePath: 'force-app/main/default/objects/Referral__c/Referral__c.object-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.Email__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/Email__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.First_Name__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/First_Name__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.Last_Name__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/Last_Name__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.Phone__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/Phone__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.Position_or_Skills__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/Position_or_Skills__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.Priority__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/Priority__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.Status__c',
              type: 'CustomField',
              filePath: 'force-app/main/default/objects/Referral__c/fields/Status__c.field-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c.All',
              type: 'ListView',
              filePath: 'force-app/main/default/objects/Referral__c/listViews/All.listView-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'WorkshopPerms',
              type: 'PermissionSet',
              filePath: 'force-app/main/default/permissionsets/WorkshopPerms.permissionset-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Referral__c',
              type: 'CustomTab',
              filePath: 'force-app/main/default/tabs/Referral__c.tab-meta.xml'
            },
            {
              state: 'Add',
              fullName: 'Account',
              type: 'Workflow',
              filePath: 'force-app/main/default/workflows/Account.workflow-meta.xml'
            }
          ]
        }
      }
    },
    {
      command: 'sfdx force:user:permset:assign -n WorkshopPerms --json',
      summary: 'assigning a permset',
      raw: {
        status: 0,
        result: {
          successes: [{ name: 'test-s0pml3myzddz@example.com', value: 'WorkshopPerms' }],
          failures: []
        }
      }
    },
    {
      command: 'sfdx force:apex:execute -f apexScripts/setup.cls --json',
      summary: 'executing some apex',
      raw: {
        status: 0,
        result: {
          compiled: true,
          compileProblem: '',
          success: true,
          line: -1,
          column: -1,
          exceptionMessage: '',
          exceptionStackTrace: '',
          logs:
            "45.0 APEX_CODE,DEBUG;APEX_PROFILING,INFO\nExecute Anonymous: // set the user's manager so our PB will work for owner's manager\nExecute Anonymous: user u = [select id, managerId from user where firstname = 'User' and lastname = 'User'];\nExecute Anonymous: \nExecute Anonymous: user i = [select id from user where firstname = 'Integration' and lastname = 'User'];\nExecute Anonymous: \nExecute Anonymous: u.managerId = i.Id;\nExecute Anonymous: \nExecute Anonymous: update u;\nExecute Anonymous: \nExecute Anonymous: //make sure all accounts are marked active\nExecute Anonymous: \nExecute Anonymous: list <account> accts = [select id, active__c from account];\nExecute Anonymous: for (account a:accts){\nExecute Anonymous: \ta.active__c = 'Yes';\nExecute Anonymous: }\nExecute Anonymous: update accts;\n23:24:11.55 (55699184)|USER_INFO|[EXTERNAL]|0051F000003Lq5M|test-s0pml3myzddz@example.com|(GMT-07:00) Pacific Daylight Time (America/Los_Angeles)|GMT-07:00\n23:24:11.55 (55719907)|EXECUTION_STARTED\n23:24:11.55 (55724011)|CODE_UNIT_STARTED|[EXTERNAL]|execute_anonymous_apex\n23:24:11.55 (255129839)|CODE_UNIT_STARTED|[EXTERNAL]|DuplicateDetector\n23:24:11.55 (258051225)|CODE_UNIT_FINISHED|DuplicateDetector\n23:24:11.55 (703046837)|CODE_UNIT_STARTED|[EXTERNAL]|DuplicateDetector\n23:24:11.55 (731574929)|CODE_UNIT_FINISHED|DuplicateDetector\n23:24:11.731 (731702231)|CUMULATIVE_LIMIT_USAGE\n23:24:11.731 (731702231)|LIMIT_USAGE_FOR_NS|(default)|\n  Number of SOQL queries: 3 out of 100\n  Number of query rows: 14 out of 50000\n  Number of SOSL queries: 0 out of 20\n  Number of DML statements: 2 out of 150\n  Number of DML rows: 13 out of 10000\n  Maximum CPU time: 0 out of 10000\n  Maximum heap size: 0 out of 6000000\n  Number of callouts: 0 out of 100\n  Number of Email Invocations: 0 out of 10\n  Number of future calls: 0 out of 50\n  Number of queueable jobs added to the queue: 0 out of 50\n  Number of Mobile Apex push calls: 0 out of 10\n\n23:24:11.731 (731702231)|CUMULATIVE_LIMIT_USAGE_END\n\n23:24:11.55 (731744019)|CODE_UNIT_FINISHED|execute_anonymous_apex\n23:24:11.55 (733352910)|EXECUTION_FINISHED\n"
        }
      }
    }
  ],
  lineCount: '20',
  additionalUsers: [],
  mainUser: {
    username: 'test-s0pml3myzddz@example.com',
    password: 'P444w0rd!',
    loginUrl:
      'https://ruby-dream-6410-dev-ed.cs90.my.salesforce.com/secur/frontdoor.jsp?sid=00D1F000000ERrx!ARAAQFnp3VCqiluStu8kTUKVZ_YKZMzHPW3I4W2lN7IYmLfP9TLD2HIGMiqtbYh.ct0sPCBAdEpu_jEIpgF0_FszywBGZjZn'
  },
  browserStartTime: '2019-06-05T17:50:15.305Z',
  buildStartTime: '2019-06-05T17:50:15.493Z',
  poolLines: { openLine: 'sfdx force:org:open' },
  orgId: '00D1F000000ERrxUAG',
  completeTimestamp: '2019-06-05T17:50:22.229Z',
  instanceUrl: 'https://ruby-dream-6410-dev-ed.cs90.my.salesforce.com/',
  openTimestamp: '2019-06-05T17:50:22.229Z',
  herokuResults: [
    {
      appName: 'Shane App 1',
      dashboardUrl: 'https://www.google.com',
      openUrl: 'https://www.google.com'
    },
    {
      appName: 'Shane App 2',
      dashboardUrl: 'https://www.google.com',
      openUrl: 'https://www.google.com'
    }
  ]
};

export { fullExample };
