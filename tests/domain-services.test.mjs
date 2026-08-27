import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ApiClient, AuthService, CountryService, CurrencyService, FileService,
  FilterOptionsResolver, NotificationService, PaymentMethodService, RouteOverlayService,
  ShipmentMethodService, UserService, WarehouseService,
  mapCountry, mapNotification, mapProduct, mapShipmentMethod, mapUser,
  mapWarehouse, toCurrencyCreateBody, toPaymentMethodUpdateBody
} from '../packages/core/dist/index.js';

function recordingClient(response = { success: true, message: null, data: [], errors: null, pagination: null, status_code: 200 }) {
  const calls = [];
  const client = new ApiClient({ baseUrl: 'https://api.example.test/api', fetch: async (url, init) => {
    calls.push({ url: new URL(url), init, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json' } });
  }});
  return { client, calls };
}

test('resource services preserve Angular paths and pagination convention', async () => {
  const { client, calls } = recordingClient();
  const countries = new CountryService(client);
  await countries.readPage({ page: 2, search: 'Niger', ignored: '' });
  await countries.readAll({ page: 9, search: 'Niger' });
  await countries.readById(7);
  assert.deepEqual(calls.map(call => call.url.pathname), ['/api/public/country/read', '/api/public/country/read/all', '/api/public/country/read/7']);
  assert.equal(calls[0].url.search, '?search=Niger&page=2&size=15');
  assert.equal(calls[1].url.search, '?search=Niger');
});

test('deep user helpers normalize plan, subscription and gateway branches field by field', async () => {
  const core = await import('../packages/core/dist/index.js');
  const account = core.mapUserBusinessAccount({
    id: '3', planType: 'monthly', type: 'business', firstPayment: '1',
    plan: { id: '4', active: '0', packages: [{ id: '5', companyServiceId: '8', volume: '12', active: 1 }] },
    subscription: { id: '6', userId: '7', paymentAmount: 19, planType: 'invalid', used: 'true' }
  });
  assert.equal(account.id, 3); assert.equal(account.plan_type, 'monthly'); assert.equal(account.first_payment, true);
  assert.equal(account.plan.packages[0].company_service_id, 8); assert.equal(account.plan.packages[0].volume, 12);
  assert.equal(account.subscription.user_id, 7); assert.equal(account.subscription.payment_amount, '19'); assert.equal(account.subscription.plan_type, null);
  assert.deepEqual(core.mapUserPaymentPayload({ redirectUrl: '/done', gatewayPayload: { authorizationUrl: '/pay', accessCode: 123 } }), {
    url: null, redirect_url: '/done', gateway_payload: { authorization_url: '/pay', access_code: '123', reference: null, redirect_url: null }, reference: null
  });
});

test('domain mappers coerce camelCase fallbacks, flags, nested rows and nullable fields', () => {
  assert.deepEqual(mapCountry({ id: '3', name: 9, iso2: 'NG', states: [{ stateCode: 25, name: 'Lagos' }] }), {
    id: 3, name: '9', iso3: '', iso2: 'NG', states: [{ name: 'Lagos', state_code: '25' }]
  });
  const product = mapProduct({ id: '8', hsCode: 101, active: '1', isExternal: 0, documentIds: ['2'], documentDetails: [4] });
  assert.equal(product.id, 8); assert.equal(product.hs_code, '101'); assert.equal(product.active, true); assert.deepEqual(product.document_ids, [2]); assert.deepEqual(product.document_details, ['4']);
  const method = mapShipmentMethod({ id: '4', seaOnly: 'YES', mode: 'invalid', zoneValues: { data: [{ zoneId: '7', mode: 'stn' }], currentPage: '2' } });
  assert.equal(method.sea_only, true); assert.equal(method.mode, 'sfn'); assert.equal(method.zone_values.current_page, 2); assert.equal(method.zone_values.data[0].zone_id, 7);
  const warehouse = mapWarehouse({ id: '5', apiEnabled: 'true', zipCode: 100, state: { stateCode: 'LA' }, country: { id: '1' } });
  assert.equal(warehouse.api_enabled, true); assert.equal(warehouse.zip_code, '100'); assert.equal(warehouse.state.state_code, 'LA');
  const notification = mapNotification({ id: 12, notifiableId: '9', data: JSON.stringify({ userId: '2', externalLink: '1' }) });
  assert.equal(notification.id, '12'); assert.equal(notification.data.user_id, 2); assert.equal(notification.data.external_link, true);
  const user = mapUser({ id: '1', firstName: 'Ada', twoFactor: '1', state: { name: 'Lagos' }, defaultPassword: 0, shippingType: 'instant' });
  assert.equal(user.id, 1); assert.equal(user.first_name, 'Ada'); assert.equal(user.two_factor, true); assert.equal(user.state, 'Lagos'); assert.equal(user.shipping_type, 'instant');
});

test('filter resolver deduplicates SDK catalogs, maps options, and leaves host sources empty', async () => {
  const { client, calls } = recordingClient({ success: true, message: null, data: [{ id: 2, name: 'Lagos' }], errors: null, pagination: null, status_code: 200 });
  const resolver = new FilterOptionsResolver(new WarehouseService(client), new ShipmentMethodService(client));
  const lists = await resolver.resolve({ fields: [
    { key: 'origin', type: 'select', optionsSource: 'warehouses' },
    { key: 'destination', type: 'select', optionsSource: 'warehouses' },
    { key: 'manifest', type: 'select', optionsSource: 'shipmentManifests' }
  ] });
  assert.deepEqual(lists, { origin: [{ value: '2', label: 'Lagos' }], destination: [{ value: '2', label: 'Lagos' }] });
  assert.equal(calls.length, 1);
  assert.deepEqual(await resolver.resolveField({ key: 'status', type: 'select', optionsSource: 'static', options: [{ value: 'open', label: 'Open' }] }), [{ value: 'open', label: 'Open' }]);
});

test('route overlay adapter mirrors query state, sibling data, manual close and teardown', async () => {
  let params = new URLSearchParams('modal=edit&id=42'); const routeListeners = new Set(); const replacements = [];
  const route = { current: () => new URLSearchParams(params), subscribe: listener => { routeListeners.add(listener); return () => routeListeners.delete(listener); }, replace: next => { replacements.push(next.toString()); params = new URLSearchParams(next); } };
  let closeListener = () => {}; let closes = 0; const opens = [];
  const modal = { open: (component, options) => { opens.push({ component, options }); return { close: () => { closes += 1; }, afterClosed: listener => { closeListener = listener; return () => { closeListener = () => {}; }; } }; } };
  const service = new RouteOverlayService(route, [{ paramKey: 'modal', routes: { edit: { component: 'Edit', overlay: 'modal' } } }], modal);
  assert.deepEqual(opens, [{ component: 'Edit', options: { data: { id: '42' } } }]);
  closeListener();
  assert.deepEqual(replacements, ['id=42']);
  params = new URLSearchParams('modal=edit&id=43'); for (const listener of routeListeners) listener(params);
  params = new URLSearchParams('id=43'); for (const listener of routeListeners) listener(params);
  assert.equal(closes, 1);
  service.destroy();
  assert.equal(routeListeners.size, 0);
});

test('auth, user and file services preserve exact methods, paths, query and bodies', async () => {
  const { client, calls } = recordingClient();
  await new AuthService(client).forgot(' user@example.com ');
  const users = new UserService(client);
  await users.changePassword({ current_password: 'old', password: 'new', password_confirmation: 'new' });
  await users.logoutFromAllSessions();
  await new FileService(client).readMultiple('file-ref');
  assert.deepEqual(calls.map(call => [call.init.method, call.url.pathname]), [
    ['POST', '/api/auth/forgot/password'], ['POST', '/api/user/change/password'],
    ['POST', '/api/user/logout-from-all-sessions'], ['POST', '/api/file/read']
  ]);
  assert.deepEqual(calls[0].body, { email: 'user@example.com' });
  assert.equal(calls[3].url.search, '?multiple=yes');
});

test('currency and payment-method writes serialize flags and invalidate GET cache', async () => {
  assert.deepEqual(toCurrencyCreateBody({ name: ' Naira ', short_code: ' NGN ', active: true, is_naira_greater: 0, payment_method_ids: ['2'] }), {
    name: 'Naira', short_code: 'NGN', multiplication_rate: '', division_rate: '', active: '1', is_naira_greater: '0', payment_method_ids: [2]
  });
  assert.deepEqual(toPaymentMethodUpdateBody({ id: '4', name: 'Card', model: 'card', active: false }), { id: 4, name: 'Card', model: 'card', active: '0' });
  const { client, calls } = recordingClient();
  let clears = 0; client.cache.clear = () => { clears += 1; };
  const currencies = new CurrencyService(client);
  await currencies.remove(8);
  await new PaymentMethodService(client).update({ id: 4, name: 'Card', model: 'card', active: true });
  assert.deepEqual(calls.map(call => [call.init.method, call.url.pathname, call.body]), [
    ['DELETE', '/api/currency/delete', { id: 8 }],
    ['PUT', '/api/payment_method/update', { id: 4, name: 'Card', model: 'card', active: '1' }]
  ]);
  assert.equal(clears, 2);
});

test('notification reads default to 30 and mark-all sends an empty body', async () => {
  const { client, calls } = recordingClient();
  const notifications = new NotificationService(client);
  await notifications.readPage();
  await notifications.markRead();
  assert.equal(calls[0].url.search, '?size=30');
  assert.deepEqual(calls[1].body, {});
  assert.equal(calls[1].url.pathname, '/api/user/notifications/update');
});
