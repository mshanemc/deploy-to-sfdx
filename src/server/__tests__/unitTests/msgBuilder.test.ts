import { deployMsgBuilder } from '../../lib/deployMsgBuilder';

describe('urlTestsMaster', () => {
    test('handles master repos', () => {
        const req = {
            query: {
                template: 'https://github.com/mshanemc/cg4Integrate'
            }
        };

        expect(deployMsgBuilder(req).repo).toBe('cg4Integrate');
        expect(deployMsgBuilder(req).username).toBe('mshanemc');
        expect(deployMsgBuilder(req).branch).toBeUndefined();

        const message = deployMsgBuilder(req);
        expect(message.deployId).toBeTruthy();
        // username-repo-timestamp
        expect(message.deployId.split('-').length).toBe(3);
        expect(message.deployId.split('-')[0]).toBe(message.username);
        expect(message.deployId.split('-')[1]).toBe(message.repo);
    });
});

describe('urlTestsBranch', () => {
    test('handles branch repos', () => {
        const req = {
            query: {
                template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet'
            }
        };

        expect(deployMsgBuilder(req).username).toBe('mshanemc');
        expect(deployMsgBuilder(req).repo).toBe('cg4Integrate');
        expect(deployMsgBuilder(req).branch).toBe('passwordSet');
        expect(deployMsgBuilder(req).firstname).toBeUndefined();
        expect(deployMsgBuilder(req).lastname).toBeUndefined();
        expect(deployMsgBuilder(req).email).toBeUndefined();

        const message = deployMsgBuilder(req);
        expect(message.deployId).toBeTruthy();
        // username-repo-timestamp
        expect(message.deployId.split('-').length).toBe(3);
        expect(message.deployId.split('-')[0]).toBe(message.username);
        expect(message.deployId.split('-')[1]).toBe(message.repo);
    });

    test('prevents bad urls', () => {
        const req = {
            query: {
                template: 'https://github.com/mshanemc/df17IntegrationWorkshops/tree/master; wget http://'
            }
        };

        expect(() => deployMsgBuilder(req)).toThrow();
    });
});

describe('userinfo', () => {
    test('handles email, firstname, lastname', () => {
        const req = {
            query: {
                template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet',
                firstname: 'shane',
                lastname: 'mclaughlin',
                email: 'shane.mclaughlin@salesforce.com'
            }
        };

        expect(deployMsgBuilder(req).username).toBe('mshanemc');
        expect(deployMsgBuilder(req).repo).toBe('cg4Integrate');
        expect(deployMsgBuilder(req).branch).toBe('passwordSet');
        expect(deployMsgBuilder(req).firstname).toBe('shane');
        expect(deployMsgBuilder(req).lastname).toBe('mclaughlin');
        expect(deployMsgBuilder(req).email).toBe('shane.mclaughlin@salesforce.com');

        const message = deployMsgBuilder(req);
        expect(message.deployId).toBeTruthy();
        // username-repo-timestamp
        expect(message.deployId.split('-').length).toBe(3);
        expect(message.deployId.split('-')[0]).toBe(message.username);
        expect(message.deployId.split('-')[1]).toBe(message.repo);
    });
});
