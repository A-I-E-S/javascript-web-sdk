import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { AFRICANIES_SHADOW_STYLES, withAfricaniesShadowStyles } from '../packages/ui/dist/index.js';

test('documented theme tokens cross shadow roots through the complete UI baseline', () => {
  assert.match(AFRICANIES_SHADOW_STYLES, /var\(--africanies-export/);
  assert.match(AFRICANIES_SHADOW_STYLES, /var\(--africanies-import/);
  assert.match(AFRICANIES_SHADOW_STYLES, /:host-context\(\.dark\)/);
  assert.match(AFRICANIES_SHADOW_STYLES, /:host-context\(\[data-africanies-mode="stn"\]\)/);
  const markup = withAfricaniesShadowStyles('<button>Save</button>');
  assert.match(markup, /^<style data-africanies-defaults>/);
  assert.match(markup, /<button>Save<\/button>$/);
});

test('compiled documented CSS import provides tokens and global overlay utilities', async () => {
  const css = await readFile(new URL('../packages/theme/theme.css', import.meta.url), 'utf8');
  for (const contract of ['--africanies-export', '--africanies-import', '.fixed', '.inset-0', '.overflow-y-auto']) {
    assert.ok(css.includes(contract), `compiled theme CSS is missing ${contract}`);
  }
  assert.match(css, /dark\\:bg-slate-950/);
  assert.match(css, /focus-visible/);
  assert.match(css, /disabled/);
});

test('default component baseline includes focus, disabled, form, feedback and overlay-host behavior', () => {
  for (const contract of [
    'focus-visible', ':disabled', '[aria-disabled="true"]', '[aria-invalid="true"]',
    '[part="alert"]', '[part="toast"]', '[part="chip"]', '[part="host"]'
  ]) assert.ok(AFRICANIES_SHADOW_STYLES.includes(contract), `missing style contract: ${contract}`);
});

test('every shadow-rendering UI family injects the shared default baseline', async () => {
  for (const file of ['index.ts', 'forms.ts', 'navigation-data.ts', 'misc.ts', 'external.ts']) {
    const source = await readFile(new URL(`../packages/ui/src/${file}`, import.meta.url), 'utf8');
    assert.match(source, /withAfricaniesShadowStyles/, `${file} bypasses the shared shadow baseline`);
  }
});

test('Tailwind scanner sees modal and drawer classes used by the overlay service', async () => {
  const source = await readFile(new URL('../packages/ui/src/overlay.ts', import.meta.url), 'utf8');
  for (const utility of ['fixed', 'inset-0', 'bg-black/50', 'dark:bg-black/70', 'focus', 'overflow-y-auto', 'dark:bg-slate-950']) {
    if (utility === 'focus') assert.match(source, /\.focus\(\)/);
    else assert.ok(source.includes(utility), `missing overlay utility: ${utility}`);
  }
});
