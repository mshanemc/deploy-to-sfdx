/* globals it, describe, before, after */
import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as util from 'util';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as dotenv from 'dotenv';

import * as parser from '../../src/lib/poolParse';
import * as utilities from '../../src/lib/utilities';

const expect = chai.expect; // we are using the "expect" style of Chai

const exec = util.promisify(require('child_process').exec);

const username = 'mshanemc';

dotenv.config();

describe('poolURLTest', function () {
	this.timeout(500000);

	it('gets an array of objects', async () => {

		if (process.env.POOLCONFIG_URL){

			// the pool is sane
			expect(process.env.POOLCONFIG_URL).to.be.a('string');

			const result = await utilities.getPoolConfig();

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

	it('gets an object from the array', async () => {
		if (process.env.POOLCONFIG_URL) {

			// the pool is sane
			expect(process.env.POOLCONFIG_URL).to.be.a('string');

			const result = await utilities.getPoolConfig();

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

describe('tests the crash course workshop', function () {

	this.timeout(500000);

	const repo = 'df17AppBuilding';
	const tmpDir = path.join(__dirname, '../../tmp');
	const filepath = path.join(__dirname, '../../tmp', repo, 'orgInit.sh');
	const cloneDirPath = path.join(__dirname, '../../tmp', repo);

	before(async () => {
		fs.ensureDirSync(tmpDir);
		await exec(`git clone https://github.com/${username}/${repo}`, { 'cwd': tmpDir });
	});

	it('works for a org:open only file', async () => {
		expect(fs.existsSync(filepath));
		const result = await parser(filepath);
		expect(result);
		expect(result.openLine).to.equal('sfdx force:org:open');
	});

	after(() => {
		rimraf.sync(cloneDirPath);
	});
});

describe('tests the trial', function () {

	this.timeout(500000);

	const repo = 'platformTrial';
	const tmpDir = path.join(__dirname, '../../tmp');
	const filepath = path.join(__dirname, '../../tmp', repo, 'orgInit.sh');
	const cloneDirPath = path.join(__dirname, '../../tmp', repo);

	before(async () => {
		fs.ensureDirSync(tmpDir);
		await exec(`git clone https://github.com/${username}/${repo}`, { 'cwd': tmpDir });
	});

	it('works for a org:open with a path', async () => {
		expect(fs.existsSync(filepath));
		const result = await parser(filepath);
		expect(result);
		expect(result.openLine).to.include('sfdx force:org:open');
		expect(result.openLine).to.include('-p');
	});

	after(() => {
		rimraf.sync(cloneDirPath);
		rimraf.sync(tmpDir);
	});
});

describe('tests the integration workshop', function () {

	this.timeout(500000);

	const repo = 'DF17integrationWorkshops';
	const tmpDir = path.join(__dirname, '../../tmp');
	const filepath = path.join(__dirname, '../../tmp', repo, 'orgInit.sh');
	const cloneDirPath = path.join(__dirname, '../../tmp', repo);

	before(async () => {
		fs.ensureDirSync(tmpDir);
		await exec(`git clone https://github.com/${username}/${repo}`, { 'cwd': tmpDir });
	});

	it('works with custom user password set', async () => {
		expect(fs.existsSync(filepath));
		const result = await parser(filepath);
		expect(result);
		expect(result.openLine).to.include('sfdx force:org:open');
		expect(result.passwordLine).to.equal('sfdx shane:user:password:set -l User -g User -p sfdx1234 --json');
	});

	after(() => {
		rimraf.sync(cloneDirPath);
		rimraf.sync(tmpDir);
	});
});