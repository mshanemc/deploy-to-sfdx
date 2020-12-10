process.env.GITHUB_USERNAME_WHITELIST = 'mshanemc';

import { deployMsgFromExpressReq, deployMsgFromAPI } from '../../lib/deployMsgBuilder';
import { DeployRequestExternalFields } from '../../lib/types';

describe('tests for post requests from using externalFields body', () => {
    const username = 'mshanemc';
    const branch = 'my-branch';
    const sampleRepo = 'sampleRepo';

    test.concurrent('handles minimal repos without branches', async () => {
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username,
                    repo: sampleRepo
                }
            ]
        };
        const result = await deployMsgFromAPI(req);
        expect(result.deployId).toEqual(expect.any(String));
        expect(result.createdTimestamp).toEqual(expect.any(Date));
        expect(result.repos[0].username).toBe(username);
    });

    test.concurrent('handles branches', async () => {
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username,
                    repo: sampleRepo,
                    branch
                }
            ]
        };
        const result = await deployMsgFromAPI(req);
        expect(result.deployId).toEqual(expect.any(String));
        expect(result.repos[0].username).toBe(username);
        expect(result.repos[0].branch).toBe(branch);
    });

    test.concurrent('properly lowercases', async () => {
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username: 'mShAneMc',
                    repo: sampleRepo
                }
            ]
        };
        const result = await deployMsgFromAPI(req);
        expect(result.deployId).toEqual(expect.any(String));
        expect(result.repos[0].username).toBe(username);
        expect(result.repos[0].repo).toBe('samplerepo');
    });

    test.concurrent('whitelists when it should', async () => {
        process.env.GITHUB_USERNAME_WHITELIST = 'mshanemc';
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username: 'mShAneMc',
                    repo: sampleRepo
                }
            ]
        };
        const result = await deployMsgFromAPI(req);
        expect(result.repos[0].whitelisted).toBe(true);
    });

    test.concurrent("does not whitelist when it shouldn't", async () => {
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username: 'notOK',
                    repo: sampleRepo
                }
            ]
        };
        const result = await deployMsgFromAPI(req);
        expect(result.repos[0].whitelisted).toBe(false);
    });

    test.concurrent('handles the full list of properties', async () => {
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username: 'notOK',
                    repo: sampleRepo,
                    branch: 'test-branch'
                },
                {
                    username: 'myOtherUsername',
                    repo: sampleRepo
                }
            ],
            email: 'test@test.com',
            firstname: 'test',
            lastname: 'test'
        };
        const result = await deployMsgFromAPI(req);
        expect(result.repos[0].whitelisted).toBe(false);
        expect(result.repos[1].whitelisted).toBe(false);
        expect(result.lastname).toBe(req.lastname);
        expect(result.firstname).toBe(req.firstname);
        expect(result.email).toBe(req.email);
    });

    test.concurrent('throws on bad repos', async () => {
        const req: DeployRequestExternalFields = {
            repos: [
                {
                    username: 'notOK',
                    repo: '../../>&',
                    branch: 'test-branch'
                },
                {
                    username: 'myOtherUsername',
                    repo: sampleRepo
                }
            ],
            email: 'test@test.com',
            firstname: 'test',
            lastname: 'test'
        };
        await expect(deployMsgFromAPI(req)).rejects.toHaveProperty(
            'message',
            `invalid characters in '${req.repos[0].repo}'`
        );
    });
});

describe('tests for get requests from express with url parameters', () => {
    describe('urlTestsMaster', () => {
        test.concurrent('handles master repos', async () => {
            const req = {
                query: {
                    template: 'https://github.com/mshanemc/cg4Integrate'
                }
            };

            const message = await deployMsgFromExpressReq(req);
            expect(message.repos[0].repo).toBe('cg4integrate');
            expect(message.repos[0].username).toBe('mshanemc');
            expect(message.repos[0].branch).toBeUndefined();

            // multi
            expect(message.repos).toHaveLength(1);
            expect(message.repos[0].repo).toBe('cg4integrate');
            expect(message.repos[0].username).toBe('mshanemc');
            expect(message.repos[0].branch).toBeUndefined();

            expect(message.deployId).toBeTruthy();
            // username-repo-timestamp
            expect(message.deployId.split('-').length).toBe(3);
            expect(message.deployId.split('-')[0]).toBe(message.repos[0].username);
            expect(message.deployId.split('-')[1]).toBe(message.repos[0].repo);
        });
    });

    describe('urlTestsBranch', () => {
        test.concurrent('handles branch repos', async () => {
            const req = {
                query: {
                    template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet'
                }
            };

            const message = await deployMsgFromExpressReq(req);
            expect(message.firstname).toBeUndefined();
            expect(message.lastname).toBeUndefined();
            expect(message.email).toBeUndefined();

            // multi
            expect(message.repos).toHaveLength(1);

            expect(message.repos[0].username).toBe('mshanemc');
            expect(message.repos[0].repo).toBe('cg4integrate');
            expect(message.repos[0].branch).toBe('passwordSet'); // branches are case sensitive

            expect(message.deployId).toBeTruthy();
            // username-repo-timestamp
            expect(message.deployId.split('-').length).toBe(3);
            expect(message.deployId.split('-')[0]).toBe(message.repos[0].username);
            expect(message.deployId.split('-')[1]).toBe(message.repos[0].repo);
        });

        test.concurrent('prevents bad urls', async () => {
            const req = {
                query: {
                    template:
                        'https://github.com/mshanemc/df17IntegrationWorkshops/tree/master; wget http://'
                }
            };
            await expect(deployMsgFromExpressReq(req)).rejects.toHaveProperty(
                'message',
                `invalid characters in '${req.query.template}'`
            );
        });
    });

    describe('userinfo', () => {
        test.concurrent('handles email, firstname, lastname', async () => {
            const req = {
                query: {
                    template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet',
                    firstname: 'shane',
                    lastname: 'mclaughlin',
                    email: 'shane.mclaughlin@salesforce.com'
                }
            };

            const message = await deployMsgFromExpressReq(req);

            expect(message.repos[0].username).toBe('mshanemc');
            expect(message.repos[0].repo).toBe('cg4integrate');
            expect(message.repos[0].branch).toBe('passwordSet');
            expect(message.firstname).toBe('shane');
            expect(message.lastname).toBe('mclaughlin');
            expect(message.email).toBe('shane.mclaughlin@salesforce.com');

            expect(message.deployId).toBeTruthy();
            // username-repo-timestamp
            expect(message.deployId.split('-').length).toBe(3);
            expect(message.deployId.split('-')[0]).toBe(message.repos[0].username);
            expect(message.deployId.split('-')[1]).toBe(message.repos[0].repo);
        });
    });

    describe('multi-template', () => {
        test.concurrent('handles array of template', async () => {
            const req = {
                query: {
                    template: [
                        'https://github.com/mshanemc/cg4Integrate',
                        'https://github.com/mshanemc/df17IntegrationWorkshops'
                    ]
                }
            };

            const message = await deployMsgFromExpressReq(req);

            // multi
            expect(message.repos).toHaveLength(2);
            expect(message.repos[0].repo).toBe('cg4integrate');
            expect(message.repos[0].username).toBe('mshanemc');
            expect(message.repos[0].branch).toBeUndefined();

            expect(message.repos[1].repo).toBe('df17integrationworkshops');
            expect(message.repos[1].username).toBe('mshanemc');
            expect(message.repos[1].branch).toBeUndefined();

            expect(message.deployId).toBeTruthy();
            // username-repo-timestamp
            expect(message.deployId.split('-').length).toBe(3);
            expect(message.deployId.split('-')[0]).toBe(message.repos[0].username);
            expect(message.deployId.split('-')[1]).toBe(message.repos[0].repo);
        });

        test.concurrent('handles branch in array of template', async () => {
            const req = {
                query: {
                    template: [
                        'https://github.com/mshanemc/cg4Integrate/tree/passwordSet',
                        'https://github.com/mshanemc/df17IntegrationWorkshops'
                    ]
                }
            };

            const message = await deployMsgFromExpressReq(req);

            // multi
            expect(message.repos).toHaveLength(2);
            expect(message.repos[0].repo).toBe('cg4integrate');
            expect(message.repos[0].username).toBe('mshanemc');
            expect(message.repos[0].branch).toBe('passwordSet');

            expect(message.repos[1].repo).toBe('df17integrationworkshops');
            expect(message.repos[1].username).toBe('mshanemc');
            expect(message.repos[1].branch).toBeUndefined();

            expect(message.deployId).toBeTruthy();
            // username-repo-timestamp
            expect(message.deployId.split('-').length).toBe(3);
            expect(message.deployId.split('-')[0]).toBe(message.repos[0].username);
            expect(message.deployId.split('-')[1]).toBe(message.repos[0].repo);
        });
    });
});
