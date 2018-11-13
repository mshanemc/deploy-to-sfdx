"use strict";
/* globals it, describe */
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
// const assert = chai.assert;
const expect = chai.expect; // we are using the "expect" style of Chai
const argStripper = require('./../../lib/argStripper.js');
describe('argStripperTest', () => {
    const cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
    it('handles create -a', () => {
        expect(argStripper(cmd, '-a', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s -d 1');
    });
    it('handles create -d', () => {
        expect(argStripper(cmd, '-d', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s -a vol');
    });
    it('handles create with a -s flag (no arg)', () => {
        expect(argStripper(cmd, '-s', true)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -a vol -d 1');
    });
    it('handles compound/chained usage', () => {
        expect(argStripper(argStripper(cmd, '-d', false), '-a', false)).to.equal('sfdx force:org:create -f config/project-scratch-def.json -s');
    });
    it('handles compound/chained usage of flags', () => {
        const fakeCmd = 'test -a -f -g';
        expect(argStripper(argStripper(fakeCmd, '-f', true), '-a', true)).to.equal('test -g');
    });
    it('handles backtick for bash characters', () => {
        const cmd2 = 'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"` --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';
        expect(argStripper(cmd2, '-n', false)).to.equal('cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos');
    });
    it('handles backtick for bash characters with more string after the closing tick', () => {
        const cmd2 = 'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"`-stg --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';
        expect(argStripper(cmd2, '-n', false)).to.equal('cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos');
    });
    it('handles backtick for bash characters not present with value', () => {
        const cmd2 = 'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"` --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';
        expect(argStripper(cmd2, '--name', false)).to.equal(cmd2);
    });
    it('handles backtick for bash characters not present without values', () => {
        const cmd2 = 'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"` --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';
        expect(argStripper(cmd2, '--json', true)).to.equal(cmd2);
    });
    it('handles double quoted strings with lots of spaces', () => {
        const cmd2 = 'sfdx shane:heroku:repo:deploy -g "Some Quoted String" -r ducati-demo-server -t autodeployed-demos';
        expect(argStripper(cmd2, '-g', false)).to.equal('sfdx shane:heroku:repo:deploy -r ducati-demo-server -t autodeployed-demos');
    });
    it('handles single quoted strings with lots of spaces', () => {
        const cmd2 = 'sfdx shane:heroku:repo:deploy -g \'Some Quoted String\' -r ducati-demo-server -t autodeployed-demos';
        expect(argStripper(cmd2, '-g', false)).to.equal('sfdx shane:heroku:repo:deploy -r ducati-demo-server -t autodeployed-demos');
    });
});
