module.exports = {
  localModulesDirs: [ 'node_modules' ],
  sourceDir: './src/client',
  resources: [ { from: 'src/client/resources', to: 'dist/resources' } ],
  devServer: {
    open: false,
    proxy: { '/': 'http://localhost:8443' },
    stats: 'errors-only'
  },
  server: {
    proxy: { '/': 'http://localhost:8443' },
    customConfig: './lib/server/web.js'
  }
}