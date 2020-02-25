import { argStripper } from '../../lib/argStripper';

describe('argStripperTest', () => {
    const cmd = 'sfdx force:org:create -f config/project-scratch-def.json -s -a vol -d 1';

    test('handles create -a', () => {
        expect(argStripper(cmd, '-a', false)).toBe('sfdx force:org:create -f config/project-scratch-def.json -s -d 1');
    });

    test('handles create -d', () => {
        expect(argStripper(cmd, '-d', false)).toBe('sfdx force:org:create -f config/project-scratch-def.json -s -a vol');
    });

    test('handles create with a -s flag (no arg)', () => {
        expect(argStripper(cmd, '-s', true)).toBe('sfdx force:org:create -f config/project-scratch-def.json -a vol -d 1');
    });

    test('handles compound/chained usage', () => {
        expect(argStripper(argStripper(cmd, '-d', false), '-a', false)).toBe('sfdx force:org:create -f config/project-scratch-def.json -s');
    });

    test('handles compound/chained usage of flags', () => {
        const fakeCmd = 'test -a -f -g';
        expect(argStripper(argStripper(fakeCmd, '-f', true), '-a', true)).toBe('test -g');
    });

    test('handles backtick for bash characters', () => {
        const cmd2 =
            'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"` --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';

        expect(argStripper(cmd2, '-n', false)).toBe(
            'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos'
        );
    });

    test('handles backtick for bash characters with more string after the closing tick', () => {
        const cmd2 =
            'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"`-stg --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';

        expect(argStripper(cmd2, '-n', false)).toBe(
            'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos'
        );
    });

    test('handles backtick for bash characters not present with value', () => {
        const cmd2 =
            'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"` --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';

        expect(argStripper(cmd2, '--name', false)).toBe(cmd2);
    });

    test('handles backtick for bash characters not present without values', () => {
        const cmd2 =
            'cd tmp;cd mshanemc-cg2-1526490058681;sfdx shane:heroku:repo:deploy -g mshanemc -r ducati-demo-server -n `basename "${PWD}"` --envUser SFDC_USERNAME --envPassword SFDC_PASSWORD -t autodeployed-demos';

        expect(argStripper(cmd2, '--json', true)).toBe(cmd2);
    });

    test('handles double quoted strings with lots of spaces', () => {
        const cmd2 = 'sfdx shane:heroku:repo:deploy -g "Some Quoted String" -r ducati-demo-server -t autodeployed-demos';

        expect(argStripper(cmd2, '-g', false)).toBe('sfdx shane:heroku:repo:deploy -r ducati-demo-server -t autodeployed-demos');
    });

    test('handles single quoted strings with lots of spaces', () => {
        const cmd2 = `sfdx shane:heroku:repo:deploy -g 'Some Quoted String' -r ducati-demo-server -t autodeployed-demos`;

        expect(argStripper(cmd2, '-g', false)).toBe('sfdx shane:heroku:repo:deploy -r ducati-demo-server -t autodeployed-demos');
    });
});
