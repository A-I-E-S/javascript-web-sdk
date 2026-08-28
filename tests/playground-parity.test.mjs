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

test('playground clone scaffold exists', async () => {
  await Promise.all([
    access(`${playgroundRoot}/index.html`),
    access(routesModulePath),
    access(shellModulePath),
    access(appModulePath)
  ]);
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
