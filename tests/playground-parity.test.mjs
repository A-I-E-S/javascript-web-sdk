import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  ANGULAR_PLAYGROUND_ROUTES,
  ANGULAR_PLAYGROUND_SHELL_REQUIREMENTS
} from './playground-parity.fixture.mjs';

const playgroundRoot = 'examples/playground';
const routesModulePath = `${playgroundRoot}/app/routes.mjs`;
const shellModulePath = `${playgroundRoot}/app/shell.mjs`;
const appModulePath = `${playgroundRoot}/app/main.mjs`;

test('playground implementation exists', async () => {
  await Promise.all([
    access(`${playgroundRoot}/index.html`),
    access(routesModulePath),
    access(shellModulePath),
    access(appModulePath)
  ]);
});

test('playground is a substantive SDK-backed replica rather than route scaffolding', async () => {
  const [routes, shell, app, html] = await Promise.all([
    readFile(routesModulePath, 'utf8'),
    readFile(shellModulePath, 'utf8'),
    readFile(appModulePath, 'utf8'),
    readFile(`${playgroundRoot}/index.html`, 'utf8')
  ]);
  assert.doesNotMatch(routes, /scaffold/i);
  assert.match(app, /africanies-web-sdk\.esm\.js/);
  assert.match(app, /defineAfricaniesElements/);
  assert.match(shell, /mobile-navigation/);
  assert.match(html, /href=["']\/packages\/theme\/theme\.css["']/);
  assert.doesNotMatch(html, /<style[\s>]/i);
  assert.match(shell, /lg:hidden/);
  assert.match(shell, /backdrop-blur-md/);
});

test('playground Tailwind utilities are statically extractable for dynamic states', async () => {
  const source = await readFile(`${playgroundRoot}/app/styles.mjs`, 'utf8');
  for (const state of ['primary', 'secondary', 'danger', 'info', 'success', 'warning', 'drawer']) {
    assert.match(source, new RegExp(`\\b${state}:`));
  }
  assert.match(source, /motion-reduce:animate-none/);
  assert.doesNotMatch(source, /safelist/i);
});

test('every canonical component and state family is represented', async () => {
  const source = await readFile(routesModulePath, 'utf8');
  for (const marker of [
    'data-demo="button-variants"', 'data-demo="alert-states"',
    'data-demo="feedback-states"', 'data-demo="overlay-states"',
    'data-demo="form-states"', 'data-demo="table-states"',
    'data-demo="toast-states"', 'data-demo="shipment-workflow"',
    'data-demo="onboarding-flow"', 'data-demo="icon-gallery"'
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('playground implements keyboard, overlay, theme and responsive navigation interactions', async () => {
  const source = await readFile(appModulePath, 'utf8');
  for (const behavior of ['keydown', 'Escape', 'aria-expanded', 'localStorage', 'showToast', 'openOverlay']) {
    assert.match(source, new RegExp(behavior));
  }
});

test('playground routes include every Angular route', async () => {
  const { PLAYGROUND_ROUTE_CONFIG } = await import(`../${routesModulePath}`);
  const actual = PLAYGROUND_ROUTE_CONFIG.map((route) => route.path).sort();
  const expected = [...ANGULAR_PLAYGROUND_ROUTES].sort();
  assert.deepEqual(actual, expected);
});

test('playground shell requirement ids are explicitly present', async () => {
  const source = await readFile(shellModulePath, 'utf8');
  for (const id of ANGULAR_PLAYGROUND_SHELL_REQUIREMENTS) {
    assert.match(source, new RegExp(`id=["']${id}["']`));
  }
});
