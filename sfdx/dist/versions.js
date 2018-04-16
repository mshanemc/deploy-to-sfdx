// Note: Leave this file as ES5 js for compatibility with earlier Node.js versions
/* eslint-disable no-console, no-process-exit, prefer-template */
'use strict';
const path = require('path');
const root = path.join(__dirname, '..');
const pjson = require(path.join(root, 'package.json'));
/**
 * Determines whether or not a tag string is a semantic version.
 *
 * @param {*} tag The possible version string
 * @returns {boolean} True, if the string is recognized as a semantic version
 */
function isVersion(tag) {
    if (!tag) {
        return false;
    }
    // From https://github.com/sindresorhus/semver-regex
    const SEMVER_REGEX = /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z\-]+(?:\.[\da-z\-]+)*)?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?$/ig;
    return SEMVER_REGEX.test(tag.toString());
}
module.exports.isVersion = isVersion;
/**
 * Compares two semantic version strings.
 *
 * @param {string} a The first version
 * @param {string} b The second version
 * @returns {number} < 0 if a < b, 0 if a == b, > 0 if a > b
 */
function compareVersions(a, b) {
    a = a || '0';
    b = b || '0';
    const ignore = /-.*$/;
    const partsA = a.replace(ignore, '').split('.');
    const partsB = b.replace(ignore, '').split('.');
    const len = Math.min(partsA.length, partsB.length);
    let diff;
    for (let i = 0; i < len; i++) {
        diff = (parseInt(partsA[i] || '0', 10)) - (parseInt(partsB[i] || '0', 10));
        if (diff) {
            return diff;
        }
    }
    return partsA.length - partsB.length;
}
module.exports.compareVersions = compareVersions;
/**
 * Checks the current Node version for compatibility before launching the CLI.
 */
function checkNodeVersion() {
    const currentVersion = process.versions.node;
    const requiredVersion = pjson.engines.node.slice(2); // chop '>=' prefix
    if (module.exports.compareVersions(currentVersion, requiredVersion) < 0) {
        console.error('Unsupported Node.js version ' + currentVersion + ', ' +
            'version ' + requiredVersion + ' or later is required.');
        process.exit(1);
    }
}
module.exports.checkNodeVersion = checkNodeVersion;
//# sourceMappingURL=versions.js.map