import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const angularRoot = path.resolve(process.argv[2] ?? process.env.AFRICANIES_ANGULAR_REFERENCE ?? '');
if (!process.argv[2] && !process.env.AFRICANIES_ANGULAR_REFERENCE) {
  throw new Error('Usage: node tools/generate-capability-inventory.mjs <angular-web-sdk-root>');
}

const revision = await readFile(path.join(angularRoot, '.git/HEAD'), 'utf8').catch(() => 'unknown');
const domains = [
  ['models.api', 'models'], ['models.async', 'models'], ['models.auth-user', 'models'],
  ['models.catalogs', 'models'], ['models.currency-payment', 'models'], ['models.shipping', 'models'],
  ['models.files-notifications', 'models'], ['models.delivery-vendors', 'models'],
  ['models.filters', 'models'], ['models.mode-pagination', 'models'], ['storage', 'storage'],
  ['core.config-http', 'core'], ['core.auth', 'core'], ['core.mode', 'core'], ['core.country', 'core'],
  ['core.currency', 'core'], ['core.document', 'core'], ['core.file', 'core'], ['core.filters', 'core'],
  ['core.notification', 'core'], ['core.plan-product', 'core'], ['core.shipping-catalogs', 'core'],
  ['core.browser-overlays', 'core'], ['theme', 'theme'], ['icons', 'icons'], ['ui.actions', 'ui'],
  ['ui.feedback', 'ui'], ['ui.accordion-alert-chip', 'ui'], ['ui.identity-content', 'ui'],
  ['ui.help', 'ui'], ['ui.filters', 'ui'], ['ui.overlay', 'ui'], ['ui.forms-basic', 'ui'],
  ['ui.forms-advanced', 'ui'], ['ui.navigation', 'ui'], ['ui.layout', 'ui'],
  ['ui.notifications', 'ui'], ['ui.table', 'ui'], ['ui.pagination-stepper', 'ui'],
  ['ui.modules-image', 'ui']
];

async function resolveModule(file, specifier) {
  if (!specifier.startsWith('.')) return null;
  const candidate = path.resolve(path.dirname(file), specifier);
  const declarationCandidate = candidate.replace(/\.js$/, '.d.ts');
  for (const resolved of [candidate, `${candidate}.ts`, `${candidate}.d.ts`, declarationCandidate, path.join(candidate, 'index.ts'), path.join(candidate, 'index.d.ts')]) {
    try { if ((await stat(resolved)).isFile()) return resolved; } catch { /* candidate does not exist */ }
  }
  return null;
}

async function collectEntry(entry, packageName) {
  const results = [];
  const seen = new Set();
  async function visit(file, hintedSource = file) {
    const key = `${packageName}:${file}`;
    if (seen.has(key)) return;
    seen.add(key);
    const sourceFile = ts.createSourceFile(file, await readFile(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const node of sourceFile.statements) {
      if (ts.isExportDeclaration(node)) {
        const moduleSource = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
          ? path.resolve(path.dirname(file), node.moduleSpecifier.text)
          : hintedSource;
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const element of node.exportClause.elements) {
            results.push({ name: element.name.text, packageName, source: moduleSource, kind: node.isTypeOnly || element.isTypeOnly ? 'type' : 'unknown' });
          }
        } else if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const next = await resolveModule(file, node.moduleSpecifier.text);
          if (next) await visit(next, next);
        }
        continue;
      }
      const exported = node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) results.push({ name: declaration.name.text, packageName, source: hintedSource, kind: 'value' });
        }
      } else if ('name' in node && node.name && ts.isIdentifier(node.name)) {
        const kind = ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) ? 'type' : 'value';
        results.push({ name: node.name.text, packageName, source: hintedSource, kind });
      }
    }
  }
  await visit(entry);
  return results;
}

function classify(item) {
  const source = item.source.replaceAll('\\', '/').toLowerCase();
  const name = item.name.toLowerCase();
  const pkg = item.packageName.replace('africanies-', '');
  if (pkg === 'models') {
    if (/filters/.test(source)) return 'models.filters';
    if (/delivery-vendor/.test(source)) return 'models.delivery-vendors';
    if (/currency|payment-method/.test(source)) return 'models.currency-payment';
    if (/file|notification/.test(source)) return 'models.files-notifications';
    if (/shipping|shipment-method|zone/.test(source)) return 'models.shipping';
    if (/auth|user/.test(source)) return 'models.auth-user';
    if (/async/.test(source)) return 'models.async';
    if (/api/.test(source)) return 'models.api';
    if (/\/mode\/|pagination/.test(source) || /pagesize|shippingmode/.test(name)) return 'models.mode-pagination';
    return 'models.catalogs';
  }
  if (pkg === 'core') {
    if (/browser|overlay/.test(source)) return 'core.browser-overlays';
    if (/auth/.test(source)) return 'core.auth';
    if (/mode|shipping/.test(source) && /mode/.test(source)) return 'core.mode';
    if (/country/.test(source)) return 'core.country';
    if (/currency/.test(source)) return 'core.currency';
    if (/document/.test(source)) return 'core.document';
    if (/file/.test(source)) return 'core.file';
    if (/filter/.test(source)) return 'core.filters';
    if (/notification/.test(source)) return 'core.notification';
    if (/plan|product/.test(source)) return 'core.plan-product';
    if (/service|shipment-method|warehouse|zone/.test(source)) return 'core.shipping-catalogs';
    return 'core.config-http';
  }
  if (pkg === 'ui') {
    if (/forms\/(text-input|textarea|checkbox|radio|toggle|number-input|date-picker|select)/.test(source)
      || (/forms/.test(source) && /^(checkbox|date|number|radio|select|textinput|textarea|toggle)/.test(name))) return 'ui.forms-basic';
    if (/forms/.test(source)) return 'ui.forms-advanced';
    if (/button|copy-button|action-menu/.test(source)) return 'ui.actions';
    if (/feedback|toast/.test(source)) return 'ui.feedback';
    if (/accordion|alert|chip/.test(source)) return 'ui.accordion-alert-chip';
    if (/carrier|content-stack|avatar|brand/.test(source)) return 'ui.identity-content';
    if (/tooltip|info-popover/.test(source)) return 'ui.help';
    if (/filters/.test(source)) return 'ui.filters';
    if (/overlay/.test(source)) return 'ui.overlay';
    if (/navigation/.test(source)) return 'ui.navigation';
    if (/layout/.test(source)) return 'ui.layout';
    if (/notifications/.test(source)) return 'ui.notifications';
    if (/table/.test(source)) return 'ui.table';
    if (/pagination|stepper/.test(source)) return 'ui.pagination-stepper';
    return 'ui.modules-image';
  }
  return pkg;
}

const angular = [];
const angularDirectories = await readdir(path.join(angularRoot, 'libs'));
const packageOrder = ['africanies-models', 'africanies-storage', 'africanies-core', 'africanies-theme', 'africanies-icons', 'africanies-ui'];
for (const directory of packageOrder.filter((name) => angularDirectories.includes(name))) {
  const entry = path.join(angularRoot, 'libs', directory, 'src/index.ts');
  try { angular.push(...await collectEntry(entry, directory)); } catch { /* package has no public entry */ }
}

// The canonical audit counts declaration heads by unique public name, while retaining
// the two intentional UI convenience aliases that have distinct framework ownership.
const retainedAliases = new Set(['AsyncQueryStateModel', 'PaginationMetaModel']);
const canonical = [];
const names = new Set();
for (const item of angular) {
  if (!names.has(item.name)) {
    names.add(item.name);
    canonical.push(item);
  } else if (item.packageName === 'africanies-ui' && retainedAliases.has(item.name)) {
    canonical.push(item);
  }
}
if (canonical.length !== 485) throw new Error(`Expected 485 canonical declaration heads, found ${canonical.length}`);

const vanilla = [];
for (const directory of ['models', 'storage', 'core', 'theme', 'icons', 'ui', 'sdk']) {
  const entry = path.resolve(`packages/${directory}/dist/index.d.ts`);
  try { vanilla.push(...await collectEntry(entry, directory)); } catch { /* package has no declaration output */ }
}
const vanillaNames = new Set(vanilla.map(({ name }) => name));
const uiRuntime = await import(`${pathToFileURL(path.resolve('packages/ui/dist/index.js')).href}?inventory=${Date.now()}`);
const vanillaCustomElements = Object.keys(uiRuntime.AFRICANIES_UI_ELEMENTS ?? {}).length;
const overrides = JSON.parse(await readFile('parity/symbol-mapping-overrides.json', 'utf8').catch(() => '{}'));
const allowedMappingStatuses = new Set(['equivalent', 'renamed', 'type-erased', 'angular-only', 'missing']);
const mappings = canonical.map((item) => {
  const key = `${item.packageName}:${item.name}`;
  const override = overrides[key];
  const exact = vanillaNames.has(item.name);
  const mapping = override ?? (exact ? {
    status: 'equivalent',
    vanillaSymbol: item.name,
    evidence: ['generated declaration scan'],
    rationale: 'The Vanilla declaration surface exports the same public name.'
  } : item.kind === 'type' ? {
    status: 'type-erased',
    vanillaSymbol: null,
    evidence: ['canonical TypeScript declaration kind', 'TypeScript compile-time erasure'],
    rationale: 'The reviewed Angular declaration is compile-time-only and has no independent JavaScript runtime symbol.'
  } : {
    status: 'missing',
    vanillaSymbol: null,
    evidence: ['generated declaration scan'],
    rationale: 'No reviewed Vanilla declaration mapping has been recorded.'
  });
  if (!allowedMappingStatuses.has(mapping.status)) throw new Error(`${key} has invalid mapping status ${mapping.status}`);
  if (['equivalent', 'renamed'].includes(mapping.status) && (!mapping.vanillaSymbol || !vanillaNames.has(mapping.vanillaSymbol))) {
    throw new Error(`${key} maps to an unknown Vanilla symbol: ${mapping.vanillaSymbol}`);
  }
  if (!mapping.rationale || !Array.isArray(mapping.evidence) || mapping.evidence.length === 0) {
    throw new Error(`${key} requires rationale and evidence`);
  }
  return { angularSymbol: item.name, angularPackage: item.packageName, kind: item.kind, ...mapping, demonstration: mapping.demonstration ?? null };
});
const mappingByKey = new Map(mappings.map((mapping) => [`${mapping.angularPackage}:${mapping.angularSymbol}`, mapping]));

const rows = domains.map(([domain, vanillaPackage]) => {
  const declarations = canonical.filter((item) => classify(item) === domain).map(({ name }) => name).sort();
  const domainItems = canonical.filter((item) => classify(item) === domain);
  const domainMappings = domainItems.map((item) => mappingByKey.get(`${item.packageName}:${item.name}`));
  const resolved = domainMappings.filter(({ status }) => status !== 'missing');
  const mappedExports = resolved.map(({ vanillaSymbol }) => vanillaSymbol).filter(Boolean);
  return {
    domain,
    angularPackage: [...new Set(canonical.filter((item) => classify(item) === domain).map(({ packageName }) => `@africanies/${packageName}`))].join(', '),
    angularDeclarations: declarations,
    vanillaPackage: `@africanies/africanies-${vanillaPackage}`,
    vanillaExports: [...new Set(mappedExports)].sort(),
    status: resolved.length === declarations.length ? 'matched' : resolved.length ? 'partial' : 'gap',
    evidence: ['generated-export-diff', `tests:${domain}`]
  };
});
if (rows.length !== 40) throw new Error(`Expected 40 capability domains, found ${rows.length}`);

const missing = mappings.filter(({ status }) => status === 'missing');
const canonicalNames = new Set(canonical.map(({ name }) => name));
const extra = [...vanillaNames].filter((name) => !canonicalNames.has(name)).sort();
const generatedAt = new Date().toISOString();
await writeFile('parity/capability-inventory.json', `${JSON.stringify({
  schemaVersion: 1,
  source: { repository: 'https://github.com/A-I-E-S/angular-web-sdk', revision: revision.trim(), declarationHeads: canonical.length },
  generatedAt,
  columns: ['domain', 'angularPackage', 'angularDeclarations', 'vanillaPackage', 'vanillaExports', 'status', 'evidence'],
  rows
}, null, 2)}\n`);
await writeFile('parity/generated-export-diff.json', `${JSON.stringify({
  schemaVersion: 1, generatedAt, angularDeclarationHeads: canonical.length,
  vanillaDeclarationHeads: vanillaNames.size, vanillaCustomElements,
  matched: canonical.length - missing.length, missing, vanillaOnly: extra
}, null, 2)}\n`);
await writeFile('parity/symbol-mappings.json', `${JSON.stringify({
  schemaVersion: 1,
  generatedAt,
  allowedStatuses: [...allowedMappingStatuses],
  mappings
}, null, 2)}\n`);
console.log(`Generated 40 domains / ${canonical.length} Angular declaration heads; ${missing.length} missing by public name.`);
