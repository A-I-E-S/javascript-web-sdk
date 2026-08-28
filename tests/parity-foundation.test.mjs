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

test('executable capability inventory has seven columns, 40 domains and 485 declaration heads', async () => {
  const inventory = await load('parity/capability-inventory.json');
  const columns = ['domain', 'angularPackage', 'angularDeclarations', 'vanillaPackage', 'vanillaExports', 'status', 'evidence'];
  assert.deepEqual(inventory.columns, columns);
  assert.equal(inventory.rows.length, 40);
  assert.equal(new Set(inventory.rows.map(({ domain }) => domain)).size, 40);
  assert.equal(inventory.rows.reduce((count, row) => count + row.angularDeclarations.length, 0), 485);
  for (const row of inventory.rows) assert.deepEqual(Object.keys(row), columns);
});

test('generated Angular-to-Vanilla export diff reconciles every canonical declaration', async () => {
  const diff = await load('parity/generated-export-diff.json');
  assert.equal(diff.angularDeclarationHeads, 485);
  assert.equal(diff.vanillaCustomElements, 56);
  assert.equal(diff.matched + diff.missing.length, 485);
  assert.ok(diff.vanillaDeclarationHeads > 0);
});

test('every canonical declaration has explicit evidence, rationale and semantic status', async () => {
  const record = await load('parity/symbol-mappings.json');
  assert.deepEqual(record.allowedStatuses, ['equivalent', 'renamed', 'type-erased', 'angular-only', 'missing']);
  assert.equal(record.mappings.length, 485);
  for (const mapping of record.mappings) {
    assert.ok(record.allowedStatuses.includes(mapping.status));
    assert.ok(mapping.evidence.length > 0);
    assert.ok(mapping.rationale.length > 0);
    if (['equivalent', 'renamed'].includes(mapping.status)) assert.ok(mapping.vanillaSymbol);
    if (mapping.demonstration !== null) {
      assert.match(mapping.demonstration.route, /^\//);
      assert.ok(mapping.demonstration.selector);
    }
  }
});
