/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { exec2String, exec2JSON } from '../lib/execProm';

const standardFlags = ['json', 'loglevel', 'targetusername', 'verbose', 'apiversion', 'targetdevhubusername', 'wait'];
const fileFlags = ['filepath', 'directory'];

const commandRewriter = async (filepath: string, command: string, flagsWeCareAbout?: CommandResult[]) => {
    if (!flagsWeCareAbout) {
        flagsWeCareAbout = await getCommandsWithFileFlagsMap();
    }
    const baseCommand = getBaseCommand(command);
    const matchingCommand = flagsWeCareAbout.find(item => item.id === baseCommand);

    if (!matchingCommand) {
        return command;
    }

    // console.log(matchingCommand);
    const originalCommmandAsArray = command.split(' ');
    // console.log(originalCommmandAsArray);
    for (const flag in matchingCommand.flags) {
        if (matchingCommand.flags[flag].char) {
            const charIndex = originalCommmandAsArray.findIndex(item => item === `-${matchingCommand.flags[flag].char}`);
            // console.log('has char');
            if (charIndex > -1) {
                // console.log('matched char');
                originalCommmandAsArray[charIndex + 1] = `${filepath}/${originalCommmandAsArray[charIndex + 1]}`;
                // console.log(originalCommmandAsArray);
            }
        }
        const nameIndex = originalCommmandAsArray.findIndex(item => item === `--${matchingCommand.flags[flag].name}`);
        if (nameIndex > -1) {
            // console.log('matched name');
            originalCommmandAsArray[nameIndex + 1] = `${filepath}/${originalCommmandAsArray[nameIndex + 1]}`;
        } else {
            // console.log(`not found: ${matchingCommand.flags[flag].name}`);
        }
    }
    return originalCommmandAsArray.join(' ');
};

const getBaseCommand = (command: string) =>
    command
        .split(' ')
        .slice(0, 2)
        .join(' ')
        .replace('sfdx ', '');

const getFullnameMap = async (command: string) => {
    const rawOuput = await exec2String(`${command} -h`);
    const optionsSection: string = rawOuput.substring(rawOuput.indexOf('OPTIONS') + 7, rawOuput.indexOf('DESCRIPTION'));
    console.log(optionsSection);
    return optionsSection;
};

const getCommandsWithFileFlagsMap = async () => {
    const commandsJSON = ((await exec2JSON('sfdx commands --json')) as CommandResult[])
        .map(item => ({
            usage: item.usage,
            // flags: item.flags,
            flags: Object.keys(item.flags)
                .filter(key => !standardFlags.includes(key)) // omit the standard flags
                .filter(key => item.flags[key].type !== 'boolean') // omit the boolean flags
                .filter(key => fileFlags.includes(getTypeFromUsageArray(item.usage, item.flags[key]))) // only keep file-related flags
                .reduce((obj, key) => {
                    obj[key] = item.flags[key];
                    return obj;
                }, {}),
            id: item.id,
            aliases: item.aliases
        }))
        .filter(item => Object.keys(item.flags).length > 0); // leave out commands with no flags at all

    // console.log(commandsJSON);
    return commandsJSON;
};

const getTypeFromUsageArray = (usage: string, flag: FlagType) => {
    const usageAsArrayResult = usageAsArray(usage);
    const index = usageAsArrayResult.findIndex(item => item === `-${flag.char}` || item === `--${flag.name}`);
    return usageAsArrayResult[index + 1];
};

const usageAsArray = usage => {
    const cleanUsage = usage
        .replace('<%= command.id %> ', '')
        .replace(/[[\]']/g, '')
        .replace(/<|>/g, '')
        .split(' ');

    return cleanUsage;
};

export { getBaseCommand, getFullnameMap, getCommandsWithFileFlagsMap, usageAsArray, getTypeFromUsageArray, commandRewriter };

interface FlagType {
    name: string;
    type: string;
    char?: string;
}

interface CommandResult {
    id: string;
    usage: string;
    flags: {
        [key: string]: FlagType;
    };
    aliases: string[];
}
