import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DELIVERY_VENDOR_IDS,
  ICON_CONTRACT,
  MODE_COLOR_CLASSES,
  PUBLIC_RUNTIME_CONTRACT,
  STORAGE_KEYS
} from './reference-contracts.fixture.mjs';

const packageEntry = (name) => `packages/${name}/src/index.ts`;

test('reference fixtures preserve stable storage and product-mode values', () => {
  assert.deepEqual(Object.values(STORAGE_KEYS), [
    'africanies.theme',
    'africanies.shippingMode',
    'africanies.modeConfig',
    'africanies.accessToken'
  ]);
  assert.deepEqual(DELIVERY_VENDOR_IDS, [
    'amazon', 'dhl', 'fedex', 'usps', 'ups', 'others'
  ]);
  assert.equal(MODE_COLOR_CLASSES.sfn.text, 'text-export');
  assert.equal(MODE_COLOR_CLASSES.stn.text, 'text-import');
  assert.deepEqual(ICON_CONTRACT, {
    count: 641,
    containerId: 'africanies-icon-sprite',
    defaultSpriteUrl: '/assets/africanies-icons/icons.sprite.svg'
  });
});

test('public runtime contract remains explicit at package entry points', async () => {
  for (const [packageName, symbols] of Object.entries(PUBLIC_RUNTIME_CONTRACT)) {
    const source = await readFile(packageEntry(packageName), 'utf8');
    for (const symbol of symbols) {
      assert.match(
        source,
        new RegExp(`\\b${symbol}\\b`),
        `${packageEntry(packageName)} must publicly expose ${symbol}`
      );
    }
  }
});

test('Vanilla requirement: public package imports do not eagerly read browser globals', async () => {
  for (const packageName of Object.keys(PUBLIC_RUNTIME_CONTRACT)) {
    const source = await readFile(packageEntry(packageName), 'utf8');
    // Match eager global identifier reads, while allowing injected instance
    // fields such as `this.#document.createElement(...)`.
    assert.doesNotMatch(source, /(?<![#\w])(?:window|document|localStorage|sessionStorage)\s*[.[]/);
  }
});
