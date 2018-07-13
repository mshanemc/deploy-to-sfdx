/* globals it, describe, before, after */
const chai = require('chai');

const expect = chai.expect; // we are using the "expect" style of Chai
const parser = require('./../lib/poolParse');
const utilities = require('./../lib/utilities');
const path = require('path');
const rimraf = require('rimraf');

const fs = require('fs');
const exec = require('child-process-es6-promise').exec;

const username = 'mshanemc';

require('dotenv').config({ path: `${__dirname}/../.env` });

describe('poolURLTest', function () {
	this.timeout(500000);

	it('gets an array of objects', async function () {
		if (process.env.POOLCONFIG_URL){

			// the pool is sane
			expect(process.env.POOLCONFIG_URL).to.be.a('string');

			const result = await utilities.getPoolConfig();
			console.log(result);

			expect(result).to.be.an('array');
			expect(result.length).to.be.above(0);
			expect(result[0].repo).to.be.a('string');
			expect(result[0].user).to.be.a('string');
			expect(result[0].quantity).to.be.a('number');
			expect(result[0].lifeHours).to.be.a('number');
			expect(result[0].quantity).to.be.above(0);
			expect(result[0].lifeHours).to.be.above(0);
		}
	});

	it('gets an object from the array', async function () {
		if (process.env.POOLCONFIG_URL) {

			// the pool is sane
			expect(process.env.POOLCONFIG_URL).to.be.a('string');

			const result = await utilities.getPoolConfig();
			console.log(result);

			const pool = await utilities.getPool(result[0].user, result[0].repo);


			expect(pool).to.be.an('object');
			expect(pool.repo).to.be.a('string');
			expect(pool.user).to.be.a('string');
			expect(pool.quantity).to.be.a('number');
			expect(pool.lifeHours).to.be.a('number');
			expect(pool.quantity).to.be.above(0);
			expect(pool.lifeHours).to.be.above(0);
		}
	});
});



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
		expect(result.passwordLine).to.equal('sfdx shane:user:password:set -l User -g User -p sfdx1234 --json');
	});

	after(function () {
		rimraf.sync(cloneDirPath);
	});
});