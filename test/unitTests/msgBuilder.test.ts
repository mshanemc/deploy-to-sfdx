/* globals it, describe */
import * as msgBuilder from '../../src/lib/deployMsgBuilder';

describe('urlTestsMaster', () => {
	test('handles master repos', () => {

		const req = {
			query: {
				template: 'https://github.com/mshanemc/cg4Integrate'
			}
		};

		expect(msgBuilder(req).repo).toBe('cg4Integrate');
		expect(msgBuilder(req).username).toBe('mshanemc');
		expect(msgBuilder(req).branch).toBeUndefined();

		const message = msgBuilder(req);
		expect(message.deployId).toBeTruthy();
		// username-repo-timestamp
		expect(message.deployId.split('-').length ).toBe(3);
		expect(message.deployId.split('-')[0] ).toBe( message.username);
		expect(message.deployId.split('-')[1] ).toBe( message.repo);

	});
});

describe('urlTestsBranch', () => {
	test('handles branch repos', () => {

		const req = {
			query: {
				template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet'
			}
		};

		expect(msgBuilder(req).username).toBe('mshanemc');
		expect(msgBuilder(req).repo).toBe('cg4Integrate');
		expect(msgBuilder(req).branch).toBe('passwordSet');
		expect(msgBuilder(req).firstname).toBeUndefined();
		expect(msgBuilder(req).lastname).toBeUndefined();
		expect(msgBuilder(req).email).toBeUndefined();

		const message = msgBuilder(req);
		expect(message.deployId).toBeTruthy();
		// username-repo-timestamp
		expect(message.deployId.split('-').length ).toBe(3);
		expect(message.deployId.split('-')[0] ).toBe( message.username);
		expect(message.deployId.split('-')[1] ).toBe( message.repo);

	});

	test('prevents bad urls', () => {
		const req = {
			query: {
				template: 'https://github.com/mshanemc/df17IntegrationWorkshops/tree/master; wget http://'
			}
		};

		expect( () => msgBuilder(req)).toThrowError();
	});
});

describe('userinfo', () => {
	test('handles email, firstname, lastname', () => {

		const req = {
			query: {
				template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet',
				firstname: 'shane',
				lastname: 'mclaughlin',
				email : 'shane.mclaughlin@salesforce.com'
			}
		};

		expect(msgBuilder(req).username).toBe('mshanemc');
		expect(msgBuilder(req).repo).toBe('cg4Integrate');
		expect(msgBuilder(req).branch).toBe('passwordSet');
		expect(msgBuilder(req).firstname).toBe('shane');
		expect(msgBuilder(req).lastname).toBe('mclaughlin');
		expect(msgBuilder(req).email).toBe('shane.mclaughlin@salesforce.com');

		const message = msgBuilder(req);
		expect(message.deployId).toBeTruthy();
		// username-repo-timestamp
		expect(message.deployId.split('-').length ).toBe(3);
		expect(message.deployId.split('-')[0] ).toBe( message.username);
		expect(message.deployId.split('-')[1] ).toBe( message.repo);

	});
});