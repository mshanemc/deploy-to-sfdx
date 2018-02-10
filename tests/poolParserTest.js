/* globals it, describe, before, after */
const chai = require('chai');

const expect = chai.expect; // we are using the "expect" style of Chai
const parser = require('./../lib/poolParse');
const path = require('path');
const rimraf = require('rimraf');

const fs = require('fs');
const exec = require('child-process-promise').exec;

const username = 'mshanemc';

describe('poolParserTest', function () {

	this.timeout(500000);

	const repo = 'df17AppBuilding';
	const tmpDir = path.join(__dirname, '../tmp');
	const filepath = path.join(__dirname, '../tmp', repo, 'orgInit.sh');
	const cloneDirPath = path.join(__dirname, '../tmp', repo);

	before(function() {
		return exec(`git clone https://github.com/${username}/${repo}`, { 'cwd': tmpDir });
	});

	it('works for a org:open only file', async function () {
		expect(fs.existsSync(filepath));
		const result = await parser(filepath);
		console.log(result);
		expect(result);
		expect(result.openLine).to.equal('sfdx force:org:open');
	});

	after(function() {
		rimraf.sync(cloneDirPath);
	});
});

describe('poolParserTest2', function () {

	this.timeout(500000);

	const repo = 'platformTrial';
	const tmpDir = path.join(__dirname, '../tmp');
	const filepath = path.join(__dirname, '../tmp', repo, 'orgInit.sh');
	const cloneDirPath = path.join(__dirname, '../tmp', repo);

	before(function () {
		return exec(`git clone https://github.com/${username}/${repo}`, { 'cwd': tmpDir });
	});

	it('works for a org:open with a path', async function () {
		expect(fs.existsSync(filepath));
		const result = await parser(filepath);
		console.log(result);
		expect(result);
		expect(result.openLine).to.include('sfdx force:org:open');
		expect(result.openLine).to.include('-p');
	});

	after(function () {
		rimraf.sync(cloneDirPath);
	});
});

describe('poolParserTest3', function () {

	this.timeout(500000);

	const repo = 'DF17integrationWorkshops';
	const tmpDir = path.join(__dirname, '../tmp');
	const filepath = path.join(__dirname, '../tmp', repo, 'orgInit.sh');
	const cloneDirPath = path.join(__dirname, '../tmp', repo);

	before(function () {
		return exec(`git clone https://github.com/${username}/${repo}`, { 'cwd': tmpDir });
	});

	it('works with custom user password set', async function () {
		expect(fs.existsSync(filepath));
		const result = await parser(filepath);
		console.log(result);
		expect(result);
		expect(result.openLine).to.include('sfdx force:org:open');
		expect(result.passwordLine).to.equal('sfdx msm:user:password:set -l User -g User -p sfdx1234 --json');
	});

	after(function () {
		rimraf.sync(cloneDirPath);
	});
});
