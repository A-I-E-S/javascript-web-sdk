import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const packages = ['models', 'storage', 'core', 'theme', 'icons', 'ui', 'sdk'];
const releaseVersion = '0.1.0';

test('public package manifests carry coordinated releasable metadata', async () => {
  for (const name of packages) {
    const manifest = JSON.parse(await readFile(`packages/${name}/package.json`, 'utf8'));
    assert.equal(manifest.version, releaseVersion, `${name} version`);
    assert.equal(manifest.publishConfig?.access, 'public', `${name} public access`);
    assert.ok(manifest.files.includes('README.md'), `${name} README allow-list`);
    assert.ok(manifest.files.includes('LICENSE'), `${name} license allow-list`);
    assert.ok(manifest.files.includes('!dist/.tsbuildinfo'), `${name} tsbuildinfo exclusion`);
    await Promise.all([access(`packages/${name}/README.md`), access(`packages/${name}/LICENSE`)]);
    for (const [dependency, version] of Object.entries(manifest.dependencies ?? {})) {
      if (dependency.startsWith('@africanies/')) assert.equal(version, releaseVersion, `${name} -> ${dependency}`);
    }
  }
});

test('umbrella package exports npm and CDN entry points and assets', async () => {
  const manifest = JSON.parse(await readFile('packages/sdk/package.json', 'utf8'));
  assert.equal(manifest.exports['./browser/esm'], './dist/africanies-web-sdk.esm.js');
  assert.equal(manifest.exports['./browser/global'], './dist/africanies-web-sdk.global.js');
  assert.equal(manifest.exports['./theme.css'], './dist/theme.css');
  assert.equal(manifest.exports['./icons.sprite.svg'], './dist/icons.sprite.svg');
});

test('browser build has reproducible playground, theme and icon inputs', async () => {
  const source = await readFile('tools/build-browser.mjs', 'utf8');
  for (const input of [
    'examples/playground',
    'packages/theme/theme.css',
    'packages/icons/assets/icons.sprite.svg',
    'dist/demo',
    'AFRICANIES_SDK_VERSION'
  ]) assert.match(source, new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('distribution documentation contains no fictitious release coordinates', async () => {
  const [readme, cdn, release] = await Promise.all([
    readFile('README.md', 'utf8'), readFile('docs/cdn.md', 'utf8'), readFile('docs/releasing.md', 'utf8')
  ]);
  assert.doesNotMatch(`${readme}\n${cdn}\n${release}`, /1\.2\.3|RELEASE_MANIFEST_VALUE/);
  assert.match(readme, /parity recovery/i);
  assert.match(cdn, /0\.1\.0/);
  assert.match(release, /npm pack/i);
});
