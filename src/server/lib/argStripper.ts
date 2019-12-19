// import logger from 'heroku-logger';
import logger from 'heroku-logger';

const argStripper = function(cmd: string, parameter: string, noarg?: boolean): string {
    // add a space to the end to simplify things
    cmd = cmd.concat(' ');

    // quickly return if it doesn't exist
    const bufferedParam = ' '.concat(parameter).concat(' ');
    if (!cmd.includes(bufferedParam)) {
        // logger.debug('param not in command');
        return cmd.trim();
    }

    let output = cmd;
    if (noarg) {
        // just remove the thing!
        output = cmd.replace(' '.concat(parameter).concat(' '), ' ');
    } else {
        // find the string
        const paramStartIndex = cmd.indexOf(' '.concat(parameter).concat(' ')) + 1;

        const paramEndIndex = paramStartIndex + parameter.length - 1; // because there'll be a space, and because origin
        const paramValueStart = paramEndIndex + 2;
        let paramValueEnd;
        // if it starts with a ` or ' or " we need to find the other end.  Otherwise, it's a space
        // eslint-disable-next-line quotes
        if (cmd.charAt(paramValueStart) === '"' || cmd.charAt(paramValueStart) === "'" || cmd.charAt(paramValueStart) === '`') {
            // logger.debug(`it is a quoted string starting with ${cmd.charAt(paramValueStart)}`);
            const quoteEnd = cmd.indexOf(cmd.charAt(paramValueStart), paramValueStart + 1);
            if (cmd.charAt(quoteEnd + 1) === ' ') {
                paramValueEnd = quoteEnd;
            } else {
                paramValueEnd = cmd.indexOf(' ', quoteEnd + 1) - 1;
            }
        } else {
            // normal type with a space
            paramValueEnd = cmd.indexOf(' ', paramValueStart) - 1;
        }
        output = cmd
            .slice(0, paramStartIndex - 1)
            .concat(' ')
            .concat(cmd.slice(paramValueEnd + 2));
    }

    logger.debug(`argStripper: converted ${cmd} to ${output}`);
    return output.trim();
};

export { argStripper };
