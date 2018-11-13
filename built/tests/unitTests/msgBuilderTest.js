"use strict";
/* globals it, describe */
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai
const msgBuilder = require('./../../lib/deployMsgBuilder');
describe('urlTestsMaster', () => {
    it('handles master repos', () => {
        const req = {
            template: 'https://github.com/mshanemc/cg4Integrate'
        };
        expect(msgBuilder(req).repo).to.equal('cg4Integrate');
        expect(msgBuilder(req).username).to.equal('mshanemc');
        expect(msgBuilder(req).branch).to.be.an('undefined');
        const message = msgBuilder(req);
        assert.isOk(message.deployId);
        // username-repo-timestamp
        assert(message.deployId.split('-').length === 3, `invalid deploytId ${message.deployId}`);
        assert(message.deployId.split('-')[0] === message.username, 'incorrect username for deployId');
        assert(message.deployId.split('-')[1] === message.repo, 'incorrect repo for deployId');
    });
});
describe('urlTestsBranch', () => {
    it('handles branch repos', () => {
        const req = {
            template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet'
        };
        expect(msgBuilder(req).username).to.equal('mshanemc');
        expect(msgBuilder(req).repo).to.equal('cg4Integrate');
        expect(msgBuilder(req).branch).to.equal('passwordSet');
        expect(msgBuilder(req).firstname).to.be.an('undefined');
        expect(msgBuilder(req).lastname).to.be.an('undefined');
        expect(msgBuilder(req).email).to.be.an('undefined');
        const message = msgBuilder(req);
        assert.isOk(message.deployId);
        // username-repo-timestamp
        assert(message.deployId.split('-').length === 3, `invalid deploytId ${message.deployId}`);
        assert(message.deployId.split('-')[0] === message.username, 'incorrect username for deployId');
        assert(message.deployId.split('-')[1] === message.repo, 'incorrect repo for deployId');
    });
});
describe('userinfo', () => {
    it('handles email, firstname, lastname', () => {
        const req = {
            template: 'https://github.com/mshanemc/cg4Integrate/tree/passwordSet',
            firstname: 'shane',
            lastname: 'mclaughlin',
            email: 'shane.mclaughlin@salesforce.com'
        };
        expect(msgBuilder(req).username).to.equal('mshanemc');
        expect(msgBuilder(req).repo).to.equal('cg4Integrate');
        expect(msgBuilder(req).branch).to.equal('passwordSet');
        expect(msgBuilder(req).firstname).to.equal('shane');
        expect(msgBuilder(req).lastname).to.equal('mclaughlin');
        expect(msgBuilder(req).email).to.equal('shane.mclaughlin@salesforce.com');
        const message = msgBuilder(req);
        assert.isOk(message.deployId);
        // username-repo-timestamp
        assert(message.deployId.split('-').length === 3, `invalid deploytId ${message.deployId}`);
        assert(message.deployId.split('-')[0] === message.username, 'incorrect username for deployId');
        assert(message.deployId.split('-')[1] === message.repo, 'incorrect repo for deployId');
    });
});
