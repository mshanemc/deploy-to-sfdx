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
