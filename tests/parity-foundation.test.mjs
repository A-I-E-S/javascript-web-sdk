import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const load = async (path) => JSON.parse(await readFile(path, 'utf8'));

test('canonical evidence declares the three required reference viewports', async () => {
  const evidence = await load('parity/canonical-evidence.json');
  assert.deepEqual(evidence.canonical.viewports.map(({ width }) => width), [1440, 768, 390]);
  assert.ok(evidence.evidence.every(({ id, route, state, viewports }) => id && route && state && viewports.length));
});

test('playground matrix covers the canonical route inventory and references known evidence', async () => {
  const [matrix, evidence, fixture] = await Promise.all([
    load('parity/playground-matrix.json'),
    load('parity/canonical-evidence.json'),
    import('./playground-parity.fixture.mjs')
  ]);
  assert.deepEqual([...matrix.routes].sort(), [...fixture.ANGULAR_PLAYGROUND_ROUTES].sort());
  const ids = new Set(evidence.evidence.map((item) => item.id));
  for (const component of matrix.components) {
    assert.ok(matrix.allowedStatuses.includes(component.status));
    assert.ok(component.evidence.length > 0);
    for (const id of component.evidence) assert.ok(ids.has(id), `Unknown evidence: ${id}`);
  }
});

test('SDK matrix entries carry explicit testable acceptance criteria', async () => {
  const matrix = await load('parity/sdk-matrix.json');
  assert.ok(matrix.domains.length >= 10);
  for (const domain of matrix.domains) {
    assert.ok(domain.id);
    assert.ok(matrix.allowedStatuses.includes(domain.status));
    assert.match(domain.acceptance, /\.$/);
  }
});

test('Tailwind build and development commands use canonical inputs and orchestration', async () => {
  const manifest = await load('package.json');
  assert.match(manifest.scripts.build, /npm run build:styles --silent/);
  assert.equal(manifest.scripts.buildStyles, undefined);
  assert.match(manifest.scripts['build:styles'], /packages\/theme\/src\/tailwind\.css/);
  assert.equal(manifest.scripts.dev, 'node tools/dev.mjs');
  assert.match(manifest.scripts['dev:styles'], /--watch/);
  assert.equal(manifest.devDependencies.tailwindcss, '3.4.19');
});

test('theme package publishes its generated CSS and reusable Tailwind preset', async () => {
  const manifest = await load('packages/theme/package.json');
  assert.equal(manifest.exports['./theme.css'], './theme.css');
  assert.equal(manifest.exports['./tailwind-preset'], './tailwind.preset.mjs');
  assert.ok(manifest.files.includes('tailwind.preset.mjs'));
});
