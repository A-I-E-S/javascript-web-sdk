import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('CDN examples pin versions and global usage carries SRI wiring', async () => {
  const esm = await readFile('examples/cdn-esm/index.html', 'utf8');
  const global = await readFile('examples/cdn-global/index.html', 'utf8');
  assert.match(esm, /@VERSION\/dist\/africanies-web-sdk\.esm\.js/);
  assert.match(global, /@VERSION\/dist\/africanies-web-sdk\.global\.js/);
  assert.match(global, /integrity="INTEGRITY" crossorigin="anonymous"/);
  assert.match(global, /Africanies\.VERSION/);
});

test('CDN guidance documents immutable caching and owner-gated publishing', async () => {
  const guidance = await readFile('docs/cdn.md', 'utf8');
  assert.match(guidance, /Do not use `@latest` in production/);
  assert.match(guidance, /SHA-384 SRI/);
  assert.match(guidance, /explicit owner approval/);
});
