import { readFile } from 'node:fs/promises';

const inventory = JSON.parse(await readFile('parity/capability-inventory.json', 'utf8'));
const diff = JSON.parse(await readFile('parity/generated-export-diff.json', 'utf8'));
const symbolMappings = JSON.parse(await readFile('parity/symbol-mappings.json', 'utf8'));
const columns = ['domain', 'angularPackage', 'angularDeclarations', 'vanillaPackage', 'vanillaExports', 'status', 'evidence'];

if (inventory.schemaVersion !== 1 || diff.schemaVersion !== 1) throw new Error('Unsupported evidence schema version');
if (inventory.rows.length !== 40) throw new Error(`Expected 40 capability domains, found ${inventory.rows.length}`);
if (JSON.stringify(inventory.columns) !== JSON.stringify(columns)) throw new Error('Capability inventory columns changed');
if (new Set(inventory.rows.map(({ domain }) => domain)).size !== 40) throw new Error('Capability domains must be unique');
for (const row of inventory.rows) {
  if (JSON.stringify(Object.keys(row)) !== JSON.stringify(columns)) throw new Error(`${row.domain} does not have the canonical seven columns`);
  if (!row.angularPackage || !row.vanillaPackage) throw new Error(`${row.domain} is missing a package mapping`);
  if (!['matched', 'partial', 'gap'].includes(row.status)) throw new Error(`${row.domain} has invalid status ${row.status}`);
  if (!Array.isArray(row.evidence) || row.evidence.length === 0) throw new Error(`${row.domain} is missing evidence references`);
}
const declarationHeads = inventory.rows.reduce((count, row) => count + row.angularDeclarations.length, 0);
if (declarationHeads !== 485 || inventory.source.declarationHeads !== 485) {
  throw new Error(`Expected 485 canonical declaration heads, found ${declarationHeads}`);
}
if (diff.angularDeclarationHeads !== 485 || diff.matched + diff.missing.length !== 485) {
  throw new Error('Generated export diff does not reconcile to 485 Angular declaration heads');
}
if (diff.vanillaCustomElements !== 56) throw new Error(`Expected 56 Vanilla custom elements, found ${diff.vanillaCustomElements}`);
if (symbolMappings.mappings.length !== 485) throw new Error(`Expected 485 symbol mappings, found ${symbolMappings.mappings.length}`);
const allowedStatuses = new Set(['equivalent', 'renamed', 'type-erased', 'angular-only', 'missing']);
for (const mapping of symbolMappings.mappings) {
  if (!allowedStatuses.has(mapping.status)) throw new Error(`${mapping.angularSymbol} has invalid mapping status`);
  if (!mapping.rationale || !mapping.evidence?.length) throw new Error(`${mapping.angularSymbol} lacks evidence or rationale`);
  if (['equivalent', 'renamed'].includes(mapping.status) && !mapping.vanillaSymbol) throw new Error(`${mapping.angularSymbol} lacks a Vanilla symbol`);
  if (mapping.demonstration !== null && (!mapping.demonstration?.route?.startsWith('/') || !mapping.demonstration?.selector)) {
    throw new Error(`${mapping.angularSymbol} has an invalid executable demonstration`);
  }
}
const missingMappings = symbolMappings.mappings.filter(({ status }) => status === 'missing').length;
if (missingMappings !== diff.missing.length) throw new Error('Symbol mappings and export diff disagree on missing declarations');
console.log(`Verified ${inventory.rows.length} capability domains / ${declarationHeads} declaration heads; ${missingMappings} mappings remain missing.`);
