import assert from 'node:assert/strict';
import test from 'node:test';

import {
  listFetchKind,
  mapCurrency,
  mapPaymentMethod,
  toCsvString,
} from '../packages/core/dist/index.js';

test('list fetch state matches the Angular blocking and keep-row contract', () => {
  assert.equal(listFetchKind({ hasData: false, reason: 'initial' }), 'loading');
  assert.equal(listFetchKind({ hasData: true, reason: 'mode' }), 'loading');
  assert.equal(listFetchKind({ hasData: true, reason: 'page' }), 'pagination');
  assert.equal(listFetchKind({ hasData: true, reason: 'focus' }), 'refreshing');
  assert.equal(listFetchKind({ hasData: true, reason: 'refresh' }), 'refreshing');
});

test('CSV serialization matches Angular headers, LF records, BOM, and terminal newline', () => {
  assert.equal(
    toCsvString({ headers: ['Name', 'Note'], rows: [['Ada', 'a,b']], bom: true }),
    '\uFEFFName,Note\nAda,"a,b"\n',
  );
  assert.equal(toCsvString({ rows: [], bom: false }), '');
});

test('currency and payment method mappers normalize nested pivots and timestamps', () => {
  const currency = mapCurrency({
    id: '4', name: 'Dollar', shortCode: 'USD', active: '1',
    paymentMethods: [{ id: '8', name: 'Card', active: 1, pivot: { currencyId: '4', paymentMethodId: '8' } }],
  });
  assert.deepEqual(currency.payment_methods[0].pivot, { currency_id: 4, payment_method_id: 8 });

  const payment = mapPaymentMethod({
    id: '8', name: 'Card', active: '1', currencies: [{ id: '4', short_code: 'USD', pivot: { currency_id: '4', payment_method_id: '8' } }],
  });
  assert.deepEqual(payment.currencies[0].pivot, { currency_id: 4, payment_method_id: 8 });
  assert.equal(payment.currencies[0].short_code, 'USD');
});
