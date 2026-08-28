import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'africanies-artifacts-'));
const tarballDirectory = path.join(temporaryRoot, 'tarballs');
const consumerDirectory = path.join(temporaryRoot, 'consumer');
const cacheDirectory = path.join(temporaryRoot, 'npm-cache');

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: cacheDirectory }
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

await Promise.all([
  mkdir(tarballDirectory, { recursive: true }),
  mkdir(consumerDirectory, { recursive: true })
]);
for (const workspace of ['models', 'storage', 'core', 'theme', 'icons', 'ui', 'sdk']) {
  const manifest = JSON.parse(await readFile(path.join(root, 'packages', workspace, 'package.json'), 'utf8'));
  const dryRun = JSON.parse(run('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], path.join(root, 'packages', workspace)));
  const files = dryRun[0]?.files?.map(file => file.path) ?? [];
  for (const required of ['README.md', 'LICENSE', 'package.json']) {
    if (!files.includes(required)) throw new Error(`${manifest.name} tarball is missing ${required}`);
  }
  if (workspace === 'theme') {
    for (const required of ['theme.css', 'tailwind.preset.mjs']) {
      if (!files.includes(required)) throw new Error(`${manifest.name} tarball is missing ${required}`);
    }
  }
  if (files.some(file => file.endsWith('.tsbuildinfo'))) throw new Error(`${manifest.name} tarball contains TypeScript build metadata`);
  run('npm', ['pack', '--silent', '--pack-destination', tarballDirectory], path.join(root, 'packages', workspace));
}

const tarballs = (await readdir(tarballDirectory))
  .filter((name) => name.endsWith('.tgz'))
  .map((name) => path.join(tarballDirectory, name));
if (tarballs.length !== 7) throw new Error(`Expected 7 package tarballs, found ${tarballs.length}`);

await writeFile(
  path.join(consumerDirectory, 'package.json'),
  JSON.stringify({ name: 'africanies-clean-install', private: true, type: 'module' })
);
run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs], consumerDirectory);
const importedVersion = run(
  'node',
  ['--input-type=module', '--eval', "import('@africanies/javascript-web-sdk').then(sdk => console.log(sdk.VERSION))"],
  consumerDirectory
);
if (importedVersion !== '0.1.0') {
  throw new Error(`Unexpected clean-install SDK version: ${importedVersion}`);
}

await Promise.all([
  access(path.join(root, 'packages/sdk/dist/theme.css')),
  access(path.join(root, 'packages/sdk/dist/icons.sprite.svg')),
  access(path.join(root, 'dist/demo/index.html')),
  access(path.join(root, 'dist/demo/sdk/africanies-web-sdk.esm.js')),
  access(path.join(root, 'dist/demo/sdk/africanies-web-sdk.global.js')),
  access(path.join(root, 'dist/demo/sdk/theme.css')),
  access(path.join(root, 'dist/demo/sdk/icons.sprite.svg'))
]);
const demoHtml = await readFile(path.join(root, 'dist/demo/index.html'), 'utf8');
if (!demoHtml.includes('./sdk/theme.css') || demoHtml.includes('/packages/theme/theme.css')) {
  throw new Error('Built playground does not reference its packaged Tailwind theme asset');
}

for (const filename of ['africanies-web-sdk.esm.js', 'africanies-web-sdk.global.js']) {
  const bytes = await readFile(path.join(root, 'packages', 'sdk', 'dist', filename));
  const integrity = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
  console.log(`${filename} ${integrity}`);
}
console.log(`Verified ${tarballs.length} package tarballs in an isolated npm consumer.`);
