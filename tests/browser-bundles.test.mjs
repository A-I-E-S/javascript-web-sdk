import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

test('CDN ESM bundle imports without browser globals', async () => {
  const sdk = await import('../packages/sdk/dist/africanies-web-sdk.esm.js');
  assert.equal(sdk.VERSION, '0.0.0-development');
  assert.equal(sdk.CORE_PACKAGE_NAME, '@africanies/africanies-core');
});

test('CDN global bundle exposes one documented Africanies namespace', async () => {
  const source = await readFile('packages/sdk/dist/africanies-web-sdk.global.js', 'utf8');
  const context = {};
  runInNewContext(source, context);
  assert.equal(typeof context.Africanies, 'object');
  assert.equal(context.Africanies.VERSION, '0.0.0-development');
  assert.equal(context.Africanies.UI_PACKAGE_NAME, '@africanies/africanies-ui');
});
