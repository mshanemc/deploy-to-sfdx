import { getCommandsWithFileFlagsMap, getBaseCommand, usageAsArray, getTypeFromUsageArray, commandRewriter } from '../../lib/flagTypeFromCommandHelp';

const usage = `<%= command.id %> -i <id> -n <string> [-d <string>] [-v <string>] [-m] [-r <url>] [-p <url>] [-k <string>] [-w <number>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`;
const cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';
const cmd2 = 'sfdx force:org:create -s -a vol -d 1';
const cmd3 = 'sfdx force:org:create --definitionfile config/project-scratch-def.json -s -a vol -d 1';

describe('flag type parsing', () => {
    // test('handles create -a', async () => {
    //     const output = await getFlagsFromCommandHelp(cmd);
    //     expect(output.find(item => item.flag === '-f')).toHaveProperty('type', 'filepath');
    // });

    test('gets base command', async () => {
        expect(getBaseCommand(cmd)).toBe('force:org:create');
    });

    // test('gets map of options', async () => {
    //     const options = await getFullnameMap(cmd);
    //     expect(options).toBeTruthy();
    // });

    test('rewrites commands', async () => {
        const results = await commandRewriter('somePath', cmd);
        expect(results).toBe('sfdx force:org:create -f somePath/config/project-scratch-def.json -s -a vol -d 1');
    });

    test('rewrites commands with full flag name', async () => {
        const results = await commandRewriter('somePath', cmd3);
        expect(results).toBe('sfdx force:org:create --definitionfile somePath/config/project-scratch-def.json -s -a vol -d 1');
    });

    test('does not rewrite commands that do not need it', async () => {
        const results = await commandRewriter('somePath', cmd2);
        expect(results).toBe(cmd2);
    });

    test('gets commandJSON', async () => {
        const output = await getCommandsWithFileFlagsMap();
        expect(output.find(item => item.id === getBaseCommand(cmd))).toBeTruthy();
    });

    test('gets usage array', () => {
        usageAsArray(usage);
    });

    test('gets type from usage (char)', () => {
        const flag = {
            name: 'name',
            type: 'option',
            char: 'n'
        };
        expect(getTypeFromUsageArray(usage, flag)).toBe('string');
    });

    test('gets type from usage (name)', () => {
        const flag = {
            name: 'apiversion',
            type: 'option'
        };
        expect(getTypeFromUsageArray(usage, flag)).toBe('string');
    });
});
