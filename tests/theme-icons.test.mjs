import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  MODE_COLOR_CLASSES,
  MODE_COLOR_SAFELIST,
  ModeColorService,
  ThemeService
} from '../packages/theme/dist/index.js';
import {
  AFRICANIES_ICON_SPRITE_URL,
  ICON_NAMES,
  IconRegistryService
} from '../packages/icons/dist/index.js';
import { MODE_COLOR_CLASSES as REFERENCE_MODE_COLORS } from './reference-contracts.fixture.mjs';

function createRoot() {
  const classes = new Set();
  return {
    classList: {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name)
    },
    classes,
    style: {}
  };
}

test('theme resolves stored preference, updates DOM, persists and notifies', () => {
  const root = createRoot();
  const values = new Map([['africanies.theme', 'dark']]);
  const storage = {
    get: (key) => values.get(key) ?? null,
    set: (key, value) => values.set(key, value)
  };
  const theme = new ThemeService({ document: { documentElement: root }, storage });
  const changes = [];
  const unsubscribe = theme.subscribe((value) => changes.push(value));

  assert.equal(theme.getTheme(), 'dark');
  assert.equal(root.classList.contains('dark'), true);
  assert.equal(root.style.colorScheme, 'dark');
  assert.equal(theme.toggle(), 'light');
  assert.equal(values.get('africanies.theme'), 'light');
  assert.deepEqual(changes, ['light']);
  unsubscribe();
  theme.setTheme('dark');
  assert.deepEqual(changes, ['light']);
});

test('theme uses system fallback and visual changes survive storage failure', () => {
  const root = createRoot();
  const theme = new ThemeService({
    document: {
      documentElement: root,
      defaultView: { matchMedia: () => ({ matches: true }) }
    },
    storage: { get: () => { throw new Error('blocked'); }, set: () => { throw new Error('blocked'); } }
  });
  assert.equal(theme.getTheme(), 'dark');
  assert.doesNotThrow(() => theme.setTheme('light'));
  assert.equal(root.style.colorScheme, 'light');
});

test('stored light preference synchronously clears stale dark prepaint state', () => {
  const root = createRoot();
  root.classList.add('dark');
  root.style.colorScheme = 'dark';
  const theme = new ThemeService({ document: { documentElement: root }, storage: { get: () => 'light', set: () => undefined } });
  assert.equal(theme.getTheme(), 'light');
  assert.equal(root.classList.contains('dark'), false);
  assert.equal(root.style.colorScheme, 'light');
});

test('mode colors preserve exact Angular class bundles and subscriptions', () => {
  let mode = 'sfn';
  let listener;
  const service = new ModeColorService({
    getMode: () => mode,
    subscribe: (next) => { listener = next; return () => { listener = undefined; }; }
  });
  const seen = [];
  const unsubscribe = service.subscribe((classes) => seen.push(classes.text));
  assert.deepEqual(MODE_COLOR_CLASSES, REFERENCE_MODE_COLORS);
  assert.deepEqual(service.getClasses(), REFERENCE_MODE_COLORS.sfn);
  mode = 'stn';
  listener('stn');
  assert.deepEqual(service.getClasses(), REFERENCE_MODE_COLORS.stn);
  assert.deepEqual(seen, ['text-import']);
  unsubscribe();
  service.destroy();
  assert.equal(MODE_COLOR_SAFELIST.length, 18);
});

test('standalone CSS preserves the Angular export/import palette', async () => {
  const css = await readFile('packages/theme/theme.css', 'utf8');
  for (const color of ['#1cbd5d', '#24dc6d', '#e4fff3', '#f08829', '#ffa95b', '#fffcef']) {
    assert.match(css, new RegExp(color));
  }
  for (const className of ['text-export', 'bg-export-subtle', 'text-import', 'bg-import-subtle']) {
    assert.match(css, new RegExp(`\\.${className}\\b`));
  }
});

test('icon-name list and generated sprite have exact bidirectional parity', async () => {
  const sprite = await readFile('packages/icons/assets/icons.sprite.svg', 'utf8');
  const symbolNames = [...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ICON_NAMES.length, 641);
  assert.equal(new Set(ICON_NAMES).size, 641);
  assert.deepEqual(symbolNames.sort(), [...ICON_NAMES].sort());
});

test('icon registry deduplicates concurrent loads and injects one hidden sprite', async () => {
  let fetches = 0;
  const bodyChildren = [];
  const document = {
    body: { prepend: (node) => bodyChildren.unshift(node) },
    createElement: () => ({ setAttribute() {} }),
    getElementById: (id) => bodyChildren.find((node) => node.id === id) ?? null
  };
  const registry = new IconRegistryService({
    document,
    fetch: async () => {
      fetches += 1;
      return { ok: true, text: async () => '<svg><symbol id="truck"/></svg>' };
    }
  });
  await Promise.all([registry.ensureLoaded(), registry.ensureLoaded()]);
  assert.equal(fetches, 1);
  assert.equal(bodyChildren.length, 1);
  assert.equal(bodyChildren[0].id, 'africanies-icon-sprite');
  assert.equal(registry.isLoaded(), true);
  assert.equal(AFRICANIES_ICON_SPRITE_URL, '/assets/africanies-icons/icons.sprite.svg');
});
