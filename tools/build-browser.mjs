import { build } from 'esbuild';

const shared = {
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  legalComments: 'linked'
};

await build({
  ...shared,
  entryPoints: ['packages/sdk/src/index.ts'],
  format: 'esm',
  outfile: 'packages/sdk/dist/africanies-web-sdk.esm.js'
});

await build({
  ...shared,
  entryPoints: ['packages/sdk/src/index.ts'],
  format: 'iife',
  globalName: 'Africanies',
  outfile: 'packages/sdk/dist/africanies-web-sdk.global.js'
});
