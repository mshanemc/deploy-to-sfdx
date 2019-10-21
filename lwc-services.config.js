// This configuration represents the default settings of `lwc-services`.
// Place this file into the root of your LWC app directory, and configure the files as needed.
module.exports = {
    // Default directory for the build output
    // buildDir: 'built/assets',
    // Default mode for build command
    mode: 'development',
    // Clears the build directory on every build
    noclear: true,
    // Defines the directory where to find the individual
    // modules. Change only when you know what you do. ;-)
    moduleDir: './src/client/modules',
    // Array of directories where to look for additional
    // modules that don't live in `moduleDir`
    localModulesDirs: ['node_modules'],
    // Defines the directory layout. Using `namespaced` is easiest. Or so.
    layout: 'namespaced',
    // Default directory for source files
    sourceDir: './src/client',
    // List of resources for copying to the build folder
    resources: [{ from: 'src/client/resources', to: 'dist/resources' }],

    // Default server options for watch command
    devServer: {
        // port: 8443,
        // host: '0.0.0.0',
        open: false,
        proxy: {
            '/': 'http://localhost:8443'
        },
        stats: 'errors-only'
        // customConfig: './lib/server/web.js'

        // noInfo: true,
        // contentBase: 'client-src'
    },
    // Default server options for serve command
    server: {
        // port: 8443,
        // host: '0.0.0.0',
        proxy: {
            '/': 'http://localhost:8443'
        },
        // open: false,
        customConfig: './lib/server/web.js'
    }
    // LWC Compiler options for production mode.
    // Find the detailed description here: https://www.npmjs.com/package/@lwc/compiler
    // lwcCompilerOutput: {
    //     production: {
    //         compat: false,
    //         minify: true,
    //         env: {
    //             NODE_ENV: 'production'
    //         }
    //     }
    // }
};
