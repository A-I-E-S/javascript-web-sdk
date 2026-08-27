import assert from 'node:assert/strict';
import test from 'node:test';
import { AFRICANIES_NAVIGATION_DATA_ELEMENTS, BreadcrumbComponent, TableComponent, TabsComponent, isExternalHref, navigateTo, routeIsActive } from '../packages/ui/dist/index.js';

test('navigation and data registry exposes all router-neutral primitives', () => {
  assert.deepEqual(Object.keys(AFRICANIES_NAVIGATION_DATA_ELEMENTS), ['africanies-breadcrumb', 'africanies-tabs', 'africanies-segment', 'africanies-shipping-mode-switch', 'africanies-side-nav', 'africanies-table', 'africanies-pagination', 'africanies-stepper', 'africanies-page-header']);
});
test('route helpers distinguish active descendants, exact routes and external URLs', () => {
  assert.equal(routeIsActive('/shipments', '/shipments/12'), true);
  assert.equal(routeIsActive('/shipments', '/shipments/12', true), false);
  assert.equal(isExternalHref('https://africanies.com'), true);
  const calls = []; navigateTo('/dashboard', { callback: href => calls.push(href) });
  assert.deepEqual(calls, ['/dashboard']);
});
test('navigation/data classes accept configuration without eagerly reading browser globals', () => {
  const breadcrumb = new BreadcrumbComponent(); breadcrumb.items = [{ href: '/', label: 'Home' }];
  const tabs = new TabsComponent(); tabs.tabs = [{ id: 'one', label: 'One' }];
  const table = new TableComponent(); table.columns = [{ key: 'name', label: 'Name', sortable: true }]; table.rows = [{ name: 'Parcel' }];
  assert.equal(breadcrumb.items[0].label, 'Home');
  assert.equal(tabs.selected, 'one');
});
