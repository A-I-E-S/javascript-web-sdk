import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
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
if (importedVersion !== '0.0.0-development') {
  throw new Error(`Unexpected clean-install SDK version: ${importedVersion}`);
}

for (const filename of ['africanies-web-sdk.esm.js', 'africanies-web-sdk.global.js']) {
  const bytes = await readFile(path.join(root, 'packages', 'sdk', 'dist', filename));
  const integrity = `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
  console.log(`${filename} ${integrity}`);
}
console.log(`Verified ${tarballs.length} package tarballs in an isolated npm consumer.`);
