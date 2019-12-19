const shellSanitize = function(input: string): boolean {
    if (!input) {
        return true;
    }
    // eslint-disable-next-line quotes
    const evilCharacters = [';', '<', '>', '|', '?', '*', '[', ']', '$', '\\', '(', ')', '{', '}', "'", '&&', '||', '&', '=', '`'];
    let ok = true;
    evilCharacters.forEach(punk => {
        if (input.includes(punk)) {
            ok = false;
        }
    });
    if (input.includes('../')) {
        return false;
    }
    return ok;
};

const filterAlphaHypenUnderscore = (input: string): string => {
    const regex = /([A-Za-z0-9\-_]+)/g;

    if (input.length === input.match(regex)[0].length) {
        return input;
    } else {
        throw new Error(`invalid characters in ${input}`);
    }
};

export { shellSanitize, filterAlphaHypenUnderscore };
