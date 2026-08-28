import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const packageNames = ['models', 'storage', 'core', 'theme', 'icons', 'ui', 'sdk'];
const forbidden = new Set(['@angular/core', '@angular/common', '@angular/cdk', 'rxjs']);

test('all public packages have stable manifests and explicit exports', async () => {
  for (const directory of packageNames) {
    const manifest = JSON.parse(await readFile(`packages/${directory}/package.json`, 'utf8'));
    assert.equal(manifest.type, 'module');
    const expectedExports = directory === 'sdk'
      ? ['.', './browser/esm', './browser/global', './theme.css', './icons.sprite.svg']
      : directory === 'theme'
      ? ['.', './theme.css', './tailwind-preset']
      : directory === 'icons'
        ? ['.', './icons.sprite.svg']
        : ['.'];
    assert.deepEqual(Object.keys(manifest.exports), expectedExports);
    assert.equal(manifest.exports['.'].types, './dist/index.d.ts');
    assert.equal(manifest.exports['.'].import, './dist/index.js');
    const expectedSideEffects = directory === 'theme'
      ? ['./theme.css']
      : directory === 'sdk'
        ? ['./dist/theme.css']
        : false;
    assert.deepEqual(manifest.sideEffects, expectedSideEffects);
  }
});

test('theme and icon packages publish their browser assets explicitly', async () => {
  const theme = JSON.parse(await readFile('packages/theme/package.json', 'utf8'));
  const icons = JSON.parse(await readFile('packages/icons/package.json', 'utf8'));
  assert.equal(theme.exports['./theme.css'], './theme.css');
  assert.equal(theme.exports['./tailwind-preset'], './tailwind.preset.mjs');
  assert.equal(icons.exports['./icons.sprite.svg'], './assets/icons.sprite.svg');
  assert.ok(theme.files.includes('theme.css'));
  assert.ok(theme.files.includes('tailwind.preset.mjs'));
  assert.ok(icons.files.includes('assets'));
});

test('workspace manifests prohibit Angular, CDK and RxJS dependencies', async () => {
  const manifests = ['package.json', ...packageNames.map((name) => `packages/${name}/package.json`)];
  for (const manifestPath of manifests) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const dependency of Object.keys(manifest[section] ?? {})) {
        assert.equal(forbidden.has(dependency), false, `${manifestPath} contains ${dependency}`);
        assert.equal(dependency.startsWith('@angular/'), false, `${manifestPath} contains ${dependency}`);
      }
    }
  }
});

test('source tree contains no Angular runtime imports', async () => {
  const pending = ['packages'];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(item);
      if (entry.isFile() && /\.(?:ts|js)$/.test(entry.name)) {
        const source = await readFile(item, 'utf8');
        assert.doesNotMatch(source, /from\s+['"](?:@angular\/|rxjs['"])/, item);
      }
    }
  }
});
