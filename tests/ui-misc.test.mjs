import assert from 'node:assert/strict';
import test from 'node:test';
import { AFRICANIES_MISC_ELEMENTS, ActionMenuComponent, FilterQueryService, carrierLogoUrl, normalizeCarrierName } from '../packages/ui/dist/index.js';

test('remaining non-external UI registry is explicit and browser-safe', () => {
  assert.equal(Object.keys(AFRICANIES_MISC_ELEMENTS).length, 17);
  const menu = new ActionMenuComponent();
  menu.items = [{ id: 'edit', label: 'Edit' }, { id: 'delete', label: 'Delete', danger: true }];
  assert.equal(menu.open, false);
});
test('carrier helpers create stable asset-safe names and URLs', () => {
  assert.equal(normalizeCarrierName(' DHL Express '), 'dhl-express');
  assert.equal(carrierLogoUrl('DHL Express'), '/assets/carriers/dhl-express.svg');
  assert.equal(carrierLogoUrl('FedEx', '/cdn/logos/'), '/cdn/logos/fedex.svg');
});
test('filter query adapter reads, writes and clears without router coupling', () => {
  const calls = [];
  const history = { replaceState: (_state, _title, url) => calls.push(url), pushState: (_state, _title, url) => calls.push(url) };
  const location = { search: '?status=paid&page=2', pathname: '/shipments' };
  const query = new FilterQueryService(history, location);
  assert.deepEqual(query.read(), { status: 'paid', page: '2' });
  query.write({ status: 'open', empty: '', nil: null });
  query.clear();
  assert.deepEqual(calls, ['/shipments?status=open', '/shipments']);
});
