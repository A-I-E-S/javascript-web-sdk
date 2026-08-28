import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const sdkManifest = JSON.parse(await readFile('packages/sdk/package.json', 'utf8'));
const sdkVersion = process.env.AFRICANIES_SDK_VERSION ?? sdkManifest.version;
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(sdkVersion)) {
  throw new Error(`Invalid AFRICANIES_SDK_VERSION: ${sdkVersion}`);
}

const shared = {
  bundle: true,
  sourcemap: true,
  target: ['es2020'],
  legalComments: 'linked',
  define: { __AFRICANIES_SDK_VERSION__: JSON.stringify(sdkVersion) }
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

await Promise.all([
  mkdir('dist', { recursive: true }),
  mkdir('packages/sdk/dist', { recursive: true })
]);
await Promise.all([
  cp('packages/sdk/dist/africanies-web-sdk.esm.js', 'dist/africanies-web-sdk.esm.js'),
  cp('packages/sdk/dist/africanies-web-sdk.esm.js.map', 'dist/africanies-web-sdk.esm.js.map'),
  cp('packages/sdk/dist/africanies-web-sdk.global.js', 'dist/africanies-web-sdk.global.js'),
  cp('packages/sdk/dist/africanies-web-sdk.global.js.map', 'dist/africanies-web-sdk.global.js.map'),
  cp('packages/theme/theme.css', 'packages/sdk/dist/theme.css'),
  cp('packages/icons/assets/icons.sprite.svg', 'packages/sdk/dist/icons.sprite.svg')
]);

// The playground is copied from committed source on every build; dist/demo is never an input.
await rm('dist/demo', { recursive: true, force: true });
await cp('examples/playground', 'dist/demo', { recursive: true });
await mkdir('dist/demo/sdk', { recursive: true });
const playgroundMain = await readFile('dist/demo/app/main.mjs', 'utf8');
await writeFile(
  'dist/demo/app/main.mjs',
  playgroundMain.replace('../../../packages/sdk/dist/africanies-web-sdk.esm.js', '../sdk/africanies-web-sdk.esm.js')
);
const playgroundHtml = await readFile('dist/demo/index.html', 'utf8');
await writeFile(
  'dist/demo/index.html',
  playgroundHtml.replace('/packages/theme/theme.css', './sdk/theme.css')
);
await Promise.all([
  cp('packages/sdk/dist/africanies-web-sdk.esm.js', 'dist/demo/sdk/africanies-web-sdk.esm.js'),
  cp('packages/sdk/dist/africanies-web-sdk.global.js', 'dist/demo/sdk/africanies-web-sdk.global.js'),
  cp('packages/theme/theme.css', 'dist/demo/sdk/theme.css'),
  cp('packages/icons/assets/icons.sprite.svg', 'dist/demo/sdk/icons.sprite.svg')
]);
