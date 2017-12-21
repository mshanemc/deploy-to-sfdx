/* globals it, describe */

const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai
const msgBuilder = require('./../lib/deployMsgBuilder');

describe('urlTestsMaster', function () {
	it('handles master repos', function () {
		const url = 'https://github.com/mshanemc/cg4Integrate';

		expect(msgBuilder(url).repo).to.equal('cg4Integrate');
		expect(msgBuilder(url).username).to.equal('mshanemc');
		expect(msgBuilder(url).branch).to.be.an('undefined');

		const message = msgBuilder(url);
		assert.isOk(message.deployId);
		// username-repo-timestamp
		assert(message.deployId.split('-').length === 3, `invalid deploytId ${message.deployId}`);
		assert(message.deployId.split('-')[0] === message.username, 'incorrect username for deployId');
		assert(message.deployId.split('-')[1] === message.repo, 'incorrect repo for deployId');

	});
});

describe('urlTestsBranch', function () {
	it('handles branch repos', function () {
		const url = 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet';
		expect(msgBuilder(url).username).to.equal('mshanemc');
		expect(msgBuilder(url).repo).to.equal('cg4Integrate');
		expect(msgBuilder(url).branch).to.equal('passwordSet');

		const message = msgBuilder(url);
		assert.isOk(message.deployId);
		// username-repo-timestamp
		assert(message.deployId.split('-').length === 3, `invalid deploytId ${message.deployId}`);
		assert(message.deployId.split('-')[0] === message.username, 'incorrect username for deployId');
		assert(message.deployId.split('-')[1] === message.repo, 'incorrect repo for deployId');

	});
});