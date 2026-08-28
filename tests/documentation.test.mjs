import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const requiredDocuments = [
  'README.md', 'SECURITY.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
  'docs/packages.md', 'docs/getting-started.md', 'docs/core-guides.md',
  'docs/theme-icons.md', 'docs/ui.md', 'docs/cdn.md',
  'docs/browser-compatibility.md', 'docs/angular-migration.md', 'docs/releasing.md'
];

test('documentation set covers every required capability and release concern', async () => {
  const corpus = (await Promise.all(requiredDocuments.map(file => readFile(file, 'utf8')))).join('\n');
  for (const term of [
    '@africanies/africanies-models', '@africanies/africanies-storage',
    '@africanies/africanies-core', '@africanies/africanies-theme',
    '@africanies/africanies-icons', '@africanies/africanies-ui',
    'ApiClient', 'AuthTokenService', 'ShippingModeService', 'StorageService',
    'ThemeService', 'IconRegistryService', 'ModalService', 'ToastService',
    'browser-global', 'SHA-384', 'Angular', 'vulnerability', 'explicit owner approval',
    'action menu', 'avatar', 'tooltip', 'app shell', 'notification drawer',
    'filter drawer', 'address input', 'file preview', 'camera capture', 'select-create',
    'table', 'pagination', 'stepper'
  ]) assert.match(corpus, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing documentation for ${term}`);
});

test('UI documentation reflects the complete registered catalog', async () => {
  const [{ AFRICANIES_UI_ELEMENTS }, guide] = await Promise.all([
    import('../packages/ui/dist/index.js'),
    readFile('docs/ui.md', 'utf8')
  ]);
  assert.ok(Object.keys(AFRICANIES_UI_ELEMENTS).length >= 50, 'expected the complete 50+ element registry');
  for (const group of ['Actions and feedback', 'Forms', 'Identity and content', 'Help and layout', 'Navigation and data', 'Notifications and filters', 'External browser capabilities']) {
    assert.match(guide, new RegExp(group));
  }
});

test('relative Markdown links resolve inside the repository', async () => {
  for (const filename of requiredDocuments) {
    const source = await readFile(filename, 'utf8');
    for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (!target || target.startsWith('#') || /^[a-z][a-z+.-]*:/i.test(target)) continue;
      const withoutAnchor = target.split('#', 1)[0];
      if (!withoutAnchor) continue;
      await assert.doesNotReject(access(path.resolve(path.dirname(filename), decodeURIComponent(withoutAnchor))), `${filename} -> ${target}`);
    }
  }
});

test('contributor attribution is preserved', async () => {
  const readme = await readFile('README.md', 'utf8');
  for (const contributor of ['Ikechukwu', 'Chinedu', 'Armstrong', 'Adebowale', 'Muhydeen', 'Dotun', 'Busola']) {
    assert.match(readme, new RegExp(`\\b${contributor}\\b`));
  }
});
