/* globals it, describe */

const chai = require('chai');

const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai
const argStripper = require('./../lib/argStripper.js');

describe('argStripperTest', function () {
	const cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';

	it('handles create -a', function () {
		expect(argStripper(cmd, '-a', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s -d 1');
	});

	it('handles create -d', function () {
		expect(argStripper(cmd, '-d', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s -a vol');
	});

	it('handles create with a -s flag (no arg)', function () {
		expect(argStripper(cmd, '-s', true)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -a vol -d 1');
	});

	it('handles compound/chained usage', function () {
		expect(argStripper(argStripper(cmd, '-d', false), '-a', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s');
	});

	it('handles compound/chained usage of flags', function () {
		const fakeCmd = 'test -a -f -g';
		expect(argStripper(argStripper(fakeCmd, '-f', true), '-a', true)).to.equal('test -g');
	});
});