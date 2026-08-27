import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ApiClient,
  ApiError,
  AuthTokenService,
  HttpResponseCache,
  ShippingModeService,
  normalizePagination,
  unwrapLaravelPaginator
} from '../packages/core/dist/index.js';
import { LocalStorageService, SessionStorageService } from '../packages/storage/dist/index.js';

function memoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.get(key) ?? null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) { values.set(key, value); }
  };
}

test('auth tokens round-trip and clear through injected storage', () => {
  const auth = new AuthTokenService(new LocalStorageService(memoryStorage()));
  assert.equal(auth.getToken(), null);
  auth.setToken('  token-1  ');
  assert.equal(auth.getToken(), 'token-1');
  auth.clearToken();
  assert.equal(auth.getToken(), null);
  auth.setToken('  ');
  assert.equal(auth.getToken(), null);
});

test('shipping mode validates storage, notifies subscribers, guards changes and clears cache', async () => {
  const storage = new SessionStorageService(memoryStorage());
  storage.set('africanies.shippingMode', 'invalid');
  let clears = 0;
  const mode = new ShippingModeService(storage, { clear: () => { clears += 1; } });
  const changes = [];
  const unsubscribe = mode.subscribe(value => changes.push(value));
  assert.equal(mode.getMode(), 'sfn');
  mode.setChangeGuard(() => false);
  assert.equal(await mode.setMode('stn'), false);
  assert.equal(mode.getMode(), 'sfn');
  mode.setChangeGuard(() => true);
  assert.equal(await mode.setMode('stn'), true);
  assert.deepEqual(changes, ['stn']);
  assert.equal(clears, 1);
  unsubscribe();
});

test('pagination helpers unwrap Laravel responses and calculate flags', () => {
  const page = { current_page: 2, per_page: 15, last_page: 3, total: 40, data: [{ id: 1 }] };
  assert.deepEqual(unwrapLaravelPaginator({ data: page }), page);
  assert.deepEqual(normalizePagination(page), {
    data: [{ id: 1 }], current_page: 2, per_page: 15, total_items: 40,
    total_pages: 3, has_next_page: true, has_previous_page: true
  });
});

test('ApiClient supplies auth/mode headers, query semantics, JSON bodies and normalization', async () => {
  const seen = [];
  const fetch = async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200, headers: { 'content-type': 'application/json' }
    });
  };
  const client = new ApiClient({
    baseUrl: 'https://api.example.test/v1/', fetch,
    authToken: { getToken: () => 'secret' }, shippingMode: { getMode: () => 'stn' }
  });
  assert.deepEqual(await client.get('/items', { query: { page: 2, empty: '', nil: null } }), { ok: true });
  assert.deepEqual(await client.post('items', { name: 'Parcel' }), { ok: true });
  assert.equal(seen[0].url, 'https://api.example.test/v1/items?page=2');
  assert.equal(seen[0].init.headers.get('authorization'), 'Bearer secret');
  assert.equal(seen[0].init.headers.get('x-shipment-mode'), 'stn');
  assert.equal(seen[0].init.headers.has('content-type'), false);
  assert.equal(seen[1].init.headers.get('content-type'), 'application/json');
  assert.equal(seen[1].init.body, JSON.stringify({ name: 'Parcel' }));
});

test('ApiClient retries retryable GETs once, caches them, and never retries writes', async () => {
  let calls = 0;
  const fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response('temporary', { status: 503 });
    return new Response(JSON.stringify({ data: { calls } }), { headers: { 'content-type': 'application/json' } });
  };
  const client = new ApiClient({
    baseUrl: 'https://api.example.test', fetch, retryDelayMs: 0,
    cache: new HttpResponseCache({ defaultTtlMs: 1000 })
  });
  assert.deepEqual(await client.get('/cached', { cache: true }), { calls: 2 });
  assert.deepEqual(await client.get('/cached', { cache: true }), { calls: 2 });
  assert.equal(calls, 2);

  const writeClient = new ApiClient({ baseUrl: 'https://api.example.test', fetch: async () => new Response('no', { status: 503 }) });
  await assert.rejects(() => writeClient.post('/items', {}), error => error instanceof ApiError && error.status === 503);
});

test('ApiClient respects external abort and owned timeout', async () => {
  const hangingFetch = (_url, init) => new Promise((_resolve, reject) => {
    if (init.signal.aborted) { reject(init.signal.reason); return; }
    init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
  });
  const client = new ApiClient({ baseUrl: 'https://api.example.test', fetch: hangingFetch, timeoutMs: 5 });
  await assert.rejects(() => client.get('/slow'), error => error?.name === 'TimeoutError');

  const controller = new AbortController();
  controller.abort(new DOMException('stop', 'AbortError'));
  await assert.rejects(() => client.get('/stop', { signal: controller.signal }), error => error?.name === 'AbortError');
});
