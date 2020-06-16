module.exports = {
    localModulesDirs: ['./node_modules/@mshanemc/lwc-oss-base/src/modules'],
    sourceDir: './src/client',
    resources: [{ from: 'src/client/resources', to: 'dist/resources' }],
    devServer: {
        proxy: { '/': 'http://localhost:8443' }
    }
};
