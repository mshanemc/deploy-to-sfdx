const evilCharacters = [';', '<', '>', '|', '?', '*', '[', ']', '$', '\\', '(', ')', '{', '}', "'", '&&', '||', '&', '=', '`', '../'];

const filterUnsanitized = (input: string): string => {
    if (evilCharacters.some((evilChar) => input.includes(evilChar))) {
        throw new Error(`invalid characters in '${input}'`);
    }
    return input;
};

const shellSanitize = (input: string): boolean => filterUnsanitized(input) === input;

const filterAlphaHypenUnderscore = (input: string): string => {
    const regex = /([A-Za-z0-9\-_]+)/g;

    if (input.length === input.match(regex)[0].length) {
        return input;
    } else {
        throw new Error(`invalid characters in '${input}'`);
    }
};

export { shellSanitize, filterAlphaHypenUnderscore, filterUnsanitized };
