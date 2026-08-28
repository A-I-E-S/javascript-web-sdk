import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const expected = {
  models: ['MODELS_PACKAGE_NAME'],
  storage: ['STORAGE_PACKAGE_NAME'],
  core: ['CORE_PACKAGE_NAME'],
  theme: ['THEME_PACKAGE_NAME'],
  icons: ['ICONS_PACKAGE_NAME'],
  ui: ['UI_PACKAGE_NAME'],
  sdk: ['VERSION']
};

test('Phase 0 public export baseline remains explicit', async () => {
  for (const [name, symbols] of Object.entries(expected)) {
    const source = await readFile(`packages/${name}/src/index.ts`, 'utf8');
    for (const symbol of symbols) assert.match(source, new RegExp(`export const ${symbol}\\b`));
  }
});
