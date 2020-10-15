import * as fs from 'fs-extra';

import { fileToLines, filesToLines } from './../../lib/fileToLines';
const filename = 'testFileLocation';
const lineToKeep = `testline`;

describe('reads lines from file', () => {
    test('writes file, then reads back', async () => {
        await fs.writeFile(filename, lineToKeep);
        const lines = await fileToLines(filename);
        expect(lines.length).toBe(1);
        expect(lines[0]).toEqual(lineToKeep);
    });
    test('handles bash bang stuff', async () => {
        const file = `#!/bin/bash
        testline`;
        await fs.writeFile(filename, file);

        const lines = await fileToLines(filename);
        expect(lines.length).toBe(1);
        expect(lines[0]).toEqual(lineToKeep);
    });
    test('writes file, then reads back, omitting comments', async () => {
        const file = `#testline
        testline`;
        await fs.writeFile(filename, file);

        const lines = await fileToLines(filename);
        expect(lines.length).toBe(1);
        expect(lines[0]).toEqual(lineToKeep);
    });
    test('writes file, then reads back, omitting blank lines and whitespace', async () => {
        const file = `


        testline  `;
        await fs.writeFile(filename, file);

        const lines = await fileToLines(filename);
        expect(lines.length).toBe(1);
        expect(lines[0]).toEqual(lineToKeep);
    });

    test('real world sample file', async () => {
        const file = `#!/bin/bash

sfdx force:mdapi:deploy -w 5 -d mdapi/autoDashboard
sfdx shane:analytics:dataset:upload -n demo_data_df_testdrives --async -f data/analytics/demo_data_df_testdrives.csv -a DF19_Demo -m data/analytics/demo_data_df_testdrives.json
sfdx shane:analytics:dataset:upload -n demo_data_df_preped --async -f data/analytics/DemoDataDFPreped.csv -a DF19_Demo -m data/analytics/DemoDataDFPreped.json 
sfdx shane:analytics:dataset:upload -n demo_data_df_service --async -f data/analytics/demo_data_df_service.csv -a DF19_Demo -m data/analytics/demo_data_df_service.json 
sfdx shane:analytics:dataset:upload -n demo_data_df_trails --async -f data/analytics/demo_data_df_trails.csv -a DF19_Demo -m data/analytics/demo_data_df_trails.json 

sfdx force:source:deploy -p force-app/
sfdx force:user:permset:assign -n autoforce_demo_pack
sfdx force:apex:execute -f data/scripts/setDemosetting.txt
sfdx force:data:tree:import -p data/sfdx-out/John-Plan.json 
sfdx force:apex:execute -f data/scripts/setRoleCall.txt
sfdx force:apex:execute -f data/scripts/setContactOwner.txt

sfdx force:mdapi:deploy -w 5 -d mdapi/LeadDuplicate

sfdx force:apex:execute -f data/scripts/sendEmail.txt`;
        await fs.writeFile(filename, file);
        const lines = await fileToLines(filename);
        expect(lines.length).toBe(13);
    });

    afterAll(async () => {
        await fs.remove(filename);
    });
});

describe('reads lines from array of files', () => {
    test('single file in array', async () => {
        await fs.writeFile('file1', 'file1');
        const result = await filesToLines(['file1']);
        expect(result.length).toBe(1);
        expect(result[0]).toEqual('file1');
    });
    test('multiple files in array', async () => {
        await fs.writeFile('file1', 'file1');
        await fs.writeFile('file2', 'file2');
        const result = await filesToLines(['file1', 'file2']);
        expect(result.length).toBe(2);
        expect(result[0]).toEqual('file1');
        expect(result[1]).toEqual('file2');
    });

    afterAll(async () => {
        await Promise.all([fs.remove('file1'), fs.remove('file2')]);
    });
});
