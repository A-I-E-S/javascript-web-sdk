import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AFRICANIES_BRAND_LOGO_MINI_URL, AFRICANIES_BRAND_LOGO_URL, ANGULAR_UI_TRANSLATIONS,
  angularUiTranslation, buildBreadcrumbsFromSideNav, deliveryVendorOptionsForStoredValue,
  deliveryVendorSelectOptions, deliveryVendorSelected, normalizeCarrierLogoSlug,
  normalizeNavPath, provideAfricaniesToasts, provideAfricaniesUiOverlays, resolveContentBackTarget
} from '../packages/ui/dist/index.js';

test('Angular modules, directives and providers have explicit non-shim Vanilla translations', () => {
  assert.equal(angularUiTranslation('AfricaniesFormsModule'), 'defineAfricaniesElements()');
  assert.equal(angularUiTranslation('CellDefDirective'), 'TableColumn.render callback');
  assert.equal(angularUiTranslation('OVERLAY_DATA'), 'OverlayContext.data');
  assert.ok(Object.keys(ANGULAR_UI_TRANSLATIONS).length >= 20);
  assert.equal(typeof provideAfricaniesToasts().show, 'function');
  const overlays = provideAfricaniesUiOverlays();
  assert.equal(typeof overlays.modal.open, 'function');
  assert.equal(typeof overlays.confirm.confirm, 'function');
});

test('identity helpers match canonical vendor and carrier normalization', () => {
  assert.equal(normalizeCarrierLogoSlug(' DHL '), 'dhl');
  assert.equal(normalizeCarrierLogoSlug('FedEx'), null);
  assert.equal(deliveryVendorSelectOptions(true).at(-1).value, 'walk-in');
  assert.deepEqual(deliveryVendorOptionsForStoredValue('Legacy Courier')[0], { label: 'Others', value: 'Legacy Courier' });
  assert.deepEqual(deliveryVendorSelected(' DHL '), { label: 'DHL', value: 'dhl' });
  assert.match(AFRICANIES_BRAND_LOGO_URL, /brand-logo\.svg$/);
  assert.match(AFRICANIES_BRAND_LOGO_MINI_URL, /brand-logo-mini\.svg$/);
});

test('router-neutral navigation translations preserve path and query behavior', () => {
  const items = [{ id: 'overview', label: 'Overview', routerLink: '/overview' }, { id: 'navigation', label: 'Navigation', routerLink: '/components/navigation' }];
  assert.equal(normalizeNavPath('/components/navigation/documents/?page=2'), '/components/navigation/documents');
  assert.equal(buildBreadcrumbsFromSideNav('/components/navigation/documents', items)[1].label, 'Navigation');
  assert.deepEqual(resolveContentBackTarget('/components/navigation', '/components/navigation/documents?page=2'), { routerLink: '/components/navigation', queryParams: { page: '2' } });
});
