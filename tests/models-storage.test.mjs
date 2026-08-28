import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DELIVERY_VENDORS,
  FilterTransport,
  cloneFilterState,
  deliveryVendorLabel,
  emptyFilterState,
  fromFilterParams,
  normalizeDeliveryVendorForForm,
  toFilterParams
} from '../packages/models/dist/index.js';
import {
  AFRICANIES_ACCESS_TOKEN_KEY,
  LocalStorageService,
  SessionStorageService,
  provideLocalStorage,
  provideSessionStorage
} from '../packages/storage/dist/index.js';

function memoryStorage(initial = {}) {
  let values = { ...initial };
  return {
    get length() { return Object.keys(values).length; },
    clear() { values = {}; },
    getItem(key) { return Object.hasOwn(values, key) ? values[key] : null; },
    key(index) { return Object.keys(values)[index] ?? null; },
    removeItem(key) { delete values[key]; },
    setItem(key, value) { values[key] = value; }
  };
}

test('delivery-vendor helpers preserve reference normalization semantics', () => {
  assert.equal(DELIVERY_VENDORS.length, 6);
  assert.equal(normalizeDeliveryVendorForForm('  FeDeX '), 'fedex');
  assert.equal(normalizeDeliveryVendorForForm('  My Courier '), 'My Courier');
  assert.equal(deliveryVendorLabel('amazon'), 'Amazon');
  assert.equal(deliveryVendorLabel('others'), '');
});

test('filter helpers serialize legacy and named transports', () => {
  const legacy = { id: 'legacy', fields: [{ key: 'status', label: 'Status', type: 'enum' }] };
  const state = { ...emptyFilterState(), page: 2, values: { status: 'paid' } };
  assert.deepEqual(toFilterParams(state, legacy), {
    order: 'desc', page: 2, filterColumn: 'status', filterValue: 'paid'
  });
  assert.deepEqual(fromFilterParams({ filterColumn: 'status', filterValue: 'paid' }, legacy).values, { status: 'paid' });

  const named = { ...legacy, transport: FilterTransport.Named };
  assert.equal(toFilterParams(state, named).status, 'paid');
  const clone = cloneFilterState(state);
  clone.values.status = 'unpaid';
  assert.equal(state.values.status, 'paid');
});

test('storage adapters JSON round-trip values through injected stores', () => {
  const local = provideLocalStorage(memoryStorage());
  const session = provideSessionStorage(memoryStorage());
  assert.ok(local instanceof LocalStorageService);
  assert.ok(session instanceof SessionStorageService);

  local.set(AFRICANIES_ACCESS_TOKEN_KEY, { token: 'test-token' });
  assert.deepEqual(local.get(AFRICANIES_ACCESS_TOKEN_KEY), { token: 'test-token' });
  local.remove(AFRICANIES_ACCESS_TOKEN_KEY);
  assert.equal(local.get(AFRICANIES_ACCESS_TOKEN_KEY), null);
});

test('storage preserves JSON and browser failure behavior', () => {
  const malformed = new LocalStorageService(memoryStorage({ broken: '{' }));
  assert.throws(() => malformed.get('broken'), SyntaxError);
  assert.throws(() => malformed.set('undefined', undefined), TypeError);

  const quota = memoryStorage();
  quota.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  assert.throws(() => new SessionStorageService(quota).set('x', 1), /full/);
});
