"use strict";
/**
 * An override of the Node.js Module._load mechanism that replaces loaded modules with
 * JavaScript proxy objects if the module is either a function or object type.  These
 * proxies defer the actual loading of required modules until some aspect of the module
 * is actually used.
 *
 * References:
 * - http://fredkschott.com/post/2014/06/require-and-the-module-system/
 * - http://2ality.com/2014/12/es6-proxies.html
 * - https://hacks.mozilla.org/2015/07/es6-in-depth-proxies-and-reflect/
 * - http://exploringjs.com/es6/ch_proxies.html
 * - https://github.com/tvcutsem/harmony-reflect/blob/master/doc/traps.md
 * - https://github.com/getify/You-Dont-Know-JS/blob/master/es6%20%26%20beyond/ch7.md
 * - http://exploringjs.com/es6/ch_proxies.html#_pitfall-not-all-objects-can-be-wrapped-transparently-by-proxies
 * - https://esdiscuss.org/topic/calling-tostring-on-function-proxy-throws-typeerror-exception
 * - https://gist.github.com/tvcutsem/6536442
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const NamedError_1 = require("../../util/NamedError");
const debug_1 = require("./debug");
class LazyModules {
    constructor(cacheDir, typeCache, modLib, fsLib = fs) {
        this.cacheDir = cacheDir;
        this.typeCache = typeCache;
        this.modLib = modLib;
        this.fsLib = fsLib;
        this.excludes = (() => {
            // Exclude Node SDK builtin modules, which already load hella quick; some of them,
            // like `os`, have intractable incompatibility issues with proxying anyway...
            const builtins = Object.keys(process.binding('natives'))
                .filter((el) => !/^_|^internal|\//.test(el));
            // Some require requests are not worth proxying, as they will be used in most runs of the CLI,
            // so proxying them can only slow things down (not by much, but why incur the extra
            // overhead?).  It's also not useful to proxy requires of .json files.
            const commons = [
                '.+\\.json',
                'debug'
            ];
            const snowflakes = [];
            // The complete set of modules for which lazy loading should be disabled
            const excludes = Array.from(new Set(builtins.concat(commons).concat(snowflakes)));
            // A regex to match exclusions
            return new RegExp(`^(?:${excludes.join('|')})\$`);
        })();
    }
    enable() {
        const origLoad = this.modLib._load;
        this.modLib._load = this.makeLazy(origLoad);
        this.modLib._load._origLoad = origLoad;
        this.moduleCache = {};
        debug_1.debug('enabled');
    }
    disable() {
        if (this.modLib._load._origLoad) {
            this.modLib._load = this.modLib._load._origLoad;
            this.moduleCache = {};
            this.typeCache.reset();
        }
        debug_1.debug('disabled');
    }
    isEnabled() {
        return !!this.modLib._load._origLoad;
    }
    getExcludes() {
        return this.excludes;
    }
    // Loads a module using the original module loader if the module is undefined
    loadIfNeeded(mod, realLoad, request, parent, isMain) {
        if (mod === undefined) {
            debug_1.trace('[lazy]', request);
            mod = realLoad(request, parent, isMain);
        }
        return mod;
    }
    // Wraps the original module loading function with the lazy proxy functionality
    makeLazy(realLoad) {
        // Modules from the excludes list will disable lazy loading for themselves and
        // an require calls made within their require subtrees.
        let disabled = false;
        // The lazy loading wrapper
        return (request, parent, isMain) => {
            // Skip the main module, since there's not point to proxying it
            if (isMain) {
                debug_1.trace('[main]', request);
                return realLoad(request, parent, isMain);
            }
            if (disabled) {
                debug_1.trace('[skip]', request);
                return realLoad(request, parent, isMain);
            }
            // Only proxy main modules (modules without a relative `\` in the request name)
            if (request.includes('/')) {
                debug_1.trace('[real]', request);
                return realLoad(request, parent, isMain);
            }
            // Test exclusions and disable proxies in that subtree when there's a match
            if (this.getExcludes().test(request)) {
                try {
                    disabled = true;
                    debug_1.trace('[real]', request);
                    return realLoad(request, parent, isMain);
                }
                finally {
                    disabled = false;
                }
            }
            // TODO: could resolveFileName be returning a misleading value causing requests to stomp on each other?
            //       the real question is why do some modules change type when the type cache is clean?
            const filename = this.modLib._resolveFilename(request, parent, isMain);
            // Return from cache if it exists rather than creating a new proxy
            const cachedModule = this.moduleCache[filename];
            if (cachedModule) {
                debug_1.trace('[cache]', request, filename, typeof cachedModule);
                return cachedModule;
            }
            if (this.typeCache.hasProxiableType(filename)) {
                // If the module's type is known and is proxiable, create and return a proxy
                return this.createProxy(filename, realLoad, request, parent, isMain);
            }
            else {
                // Otherwise, immediately load the module without a proxy, recording its type in the type cache
                return this.loadModule(filename, realLoad, request, parent, isMain);
            }
        };
    }
    loadModule(filename, realLoad, request, parent, isMain) {
        const mod = realLoad(request, parent, isMain);
        const type = typeof mod;
        // Circular module refs can cause premature requires of modules to
        // _load as an empty object, so if we detect this we ignore recording
        // the type on that pass and simply return the module stubs as Node's
        // native _load would; if they are _loaded again later, they may reify
        // correctly and we'll catch it then.  This is known to happen with
        // jsforce/lib/connection.js, as an example.
        //
        // Some modules legitimately return an empty object, or do nothing but
        // cause side effects, which results in the same thing.  In these cases
        // the noop should not be harmful.
        if (Object.keys(mod).length === 0 && mod.constructor === Object) {
            debug_1.trace('[noop]', request, filename, type);
        }
        else {
            debug_1.trace('[type]', request, filename, type);
            this.typeCache.setType(filename, type);
        }
        this.moduleCache[filename] = mod;
        return mod;
    }
    createProxy(filename, realLoad, request, parent, isMain) {
        debug_1.trace('[proxy]', request, filename, this.typeCache.getType(filename));
        // Create a new lazy loading module proxy
        let mod;
        const proxyTarget = this.typeCache.getTargetForProxiableType(filename);
        const proxy = new Proxy(proxyTarget, {
            apply: (target, thisArg, argumentsList) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    if (typeof mod !== 'function') {
                        throw new NamedError_1.NamedError('LazyModuleProxyTypeError', `Module ${request} is not a function: possible typeof error`);
                    }
                    return Reflect.apply(mod, thisArg, argumentsList);
                }
                catch (err) {
                    debug_1.trace('error:apply', request, mod, err);
                    throw err;
                }
            },
            construct: (target, argumentsList, newTarget) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    if (typeof mod !== 'function') {
                        throw new NamedError_1.NamedError('LazyModuleProxyTypeError', `Module ${request} is not a constructor: possible typeof error`);
                    }
                    return Reflect.construct(mod, argumentsList, newTarget);
                }
                catch (err) {
                    debug_1.trace('error:construct', request, mod, err);
                    throw err;
                }
            },
            defineProperty: (target, propertyKey, attributes) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    return Reflect.defineProperty(mod, propertyKey, attributes);
                }
                catch (err) {
                    debug_1.trace('error:defineProperty', request, mod, err);
                    throw err;
                }
            },
            deleteProperty: (target, propertyKey) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    const modDesc = Reflect.getOwnPropertyDescriptor(mod, propertyKey);
                    if (modDesc && !modDesc.configurable) {
                        return false;
                    }
                    return Reflect.deleteProperty(mod, propertyKey);
                }
                catch (err) {
                    debug_1.trace('error:deleteProperty', request, mod, propertyKey, err);
                    throw err;
                }
            },
            // eslint-disable-next-line no-unused-vars
            get: (target, propertyKey, receiver) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                if (propertyKey === 'toString') {
                    // The JS proxy spec has an annoying gap that causes toString on proxied functions
                    // to throw an error, so we override the proxy's built-in toString function
                    // with our own as a workaround. To see the root issue, try the following:
                    //     > node -e 'new Proxy(function () {}, {}).toString()'
                    return (...args) => mod.toString(...args);
                }
                if (mod[propertyKey] !== undefined) {
                    return mod[propertyKey];
                }
                // Invariant constraints require that we return a value for any non-configurable, non-writable
                // property that exists on the target, so the following satisfies that constraint should there not
                // be an equivalent value on the target module; this can happen if the proxy target, which is always
                // a function, is asked for a value for its `arguments` or `caller` properties, which are discoverable
                // dynamically through the use of Object.getOwnPropertyNames, for example
                const targetDesc = Object.getOwnPropertyDescriptor(target, propertyKey);
                if (targetDesc && !targetDesc.configurable && !targetDesc.writable) {
                    return target[propertyKey];
                }
                return undefined;
            },
            getOwnPropertyDescriptor: (target, propertyKey) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                const targetDesc = Object.getOwnPropertyDescriptor(target, propertyKey);
                let modDesc;
                try {
                    modDesc = Reflect.getOwnPropertyDescriptor(mod, propertyKey);
                }
                catch (err) {
                    debug_1.trace('error:getOwnPropertyDescriptor', request, mod, propertyKey, err);
                    throw err;
                }
                if (targetDesc && !modDesc) {
                    return targetDesc;
                }
                if (!targetDesc && modDesc && !modDesc.configurable) {
                    modDesc.configurable = true;
                    return modDesc;
                }
                if (targetDesc && modDesc && modDesc.configurable !== targetDesc.configurable) {
                    modDesc.configurable = targetDesc.configurable;
                }
                return modDesc;
            },
            // eslint-disable-next-line no-unused-vars
            getPrototypeOf: (target) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    return Object.getPrototypeOf(mod);
                }
                catch (err) {
                    debug_1.trace('error:defineProperty', request, mod, err);
                    throw err;
                }
            },
            has: (target, propertyKey) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    return Reflect.has(mod, propertyKey);
                }
                catch (err) {
                    debug_1.trace('error:has', request, mod, propertyKey, err);
                    throw err;
                }
            },
            isExtensible: (target) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    const isExtensible = Reflect.isExtensible(mod);
                    if (!isExtensible && Object.isExtensible(target)) {
                        Object.freeze(target);
                    }
                    return isExtensible;
                }
                catch (err) {
                    debug_1.trace('error:isExtensible', request, mod, err);
                    throw err;
                }
            },
            ownKeys: (target) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                // Target keys need to filter out configurable properties
                const targetKeys = Object.getOwnPropertyNames(target)
                    .filter((k) => !Object.getOwnPropertyDescriptor(target, k).configurable);
                try {
                    // Due to the potential for type mismatches between the target and module,
                    // we need to make sure the target keys are included in this result in order
                    // to satisfy possible property invariant constraint checks; doing so can
                    // in turn foil the ability to freeze the module through the proxy, however,
                    // but the workaround to that issue is for now to not allow freezing across the
                    // proxy membrane, which is hopefully a very rare need anyway
                    const modKeys = Reflect.ownKeys(mod);
                    return Array.from(new Set(modKeys.concat(targetKeys)));
                }
                catch (err) {
                    debug_1.trace('error:ownKeys', request, mod, err);
                    throw err;
                }
            },
            // eslint-disable-next-line no-unused-vars
            preventExtensions: (target) => {
                // See notes in ownKeys, but in short, freezing modules across the proxy membrane is
                // fraught with peril due to type mismatches, and I have not found a way to make it work
                // while not either breaking or severely complicating other use cases; since it's rare,
                // we just don't support it at this time
                throw new TypeError(`Proxied modules cannot properly support freezing; add '${request}' to the excludes list`);
            },
            set: (target, propertyKey, value, receiver) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    return Reflect.set(mod, propertyKey, value, receiver);
                }
                catch (err) {
                    debug_1.trace('error:set', request, mod, propertyKey, err);
                    throw err;
                }
            },
            setPrototypeOf: (target, prototype) => {
                mod = this.loadIfNeeded(mod, realLoad, request, parent, isMain);
                try {
                    return Reflect.setPrototypeOf(mod, prototype);
                }
                catch (err) {
                    debug_1.trace('error:setPrototypeOf', request, mod, err);
                    throw err;
                }
            }
        });
        this.moduleCache[filename] = proxy;
        return proxy;
    }
}
exports.default = LazyModules;
//# sourceMappingURL=LazyModules.js.map