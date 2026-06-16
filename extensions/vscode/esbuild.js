const esbuild = require('esbuild')

const production = process.argv.includes('--production')

esbuild
  .build({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    outfile: 'dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    sourcemap: !production,
    minify: production,
  })
  .then(() => {
    if (production) {
      console.log('Build complete (production)')
    } else {
      console.log('Build complete (development)')
    }
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
