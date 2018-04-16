"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const NamedError_1 = require("./NamedError");
const CLI_KEY_MARKER = '--';
function parseSimpleArgs(cliArgs) {
    if (cliArgs) {
        return cliArgs.reduce((accum, arg, currentIndex, _array) => {
            if (arg && (arg === '--help' || arg === '-h')) {
                return _.set(accum, 'help', 'true');
            }
            if (arg && arg.startsWith(CLI_KEY_MARKER)) {
                const potentialValue = _array[currentIndex + 1];
                const argTrimmed = _.trim(_.split(arg, CLI_KEY_MARKER)[1]);
                // Case where there is no value because it's an 'enable' kinda thing, Don't specify if false.
                if (!potentialValue || potentialValue.startsWith(CLI_KEY_MARKER)) {
                    throw new NamedError_1.NamedError('ParameterMissingValue', `The parameter ${arg} is missing it's value`);
                }
                else {
                    // otherwise a value was set.
                    return _.set(accum, argTrimmed, _.trim(potentialValue));
                }
            }
            else {
                return accum;
            }
        }, {});
    }
}
exports.default = parseSimpleArgs;
//# sourceMappingURL=simpleArgs.js.map