import assert from 'node:assert/strict';
import test from 'node:test';

import { withToast } from '../packages/core/dist/index.js';
import {
  AppShellContentHeaderComponent,
  AppShellHeaderComponent,
  ConfirmDialogComponent,
  FilterDrawerPanel,
  NotificationDrawerPanel,
  headerGreetingFirstName,
  headerGreetingPeriod,
  headerGreetingPool,
  pickHeaderGreeting,
  resolveParentPathFromRootSnapshot
} from '../packages/ui/dist/index.js';

test('withToast preserves canonical default and override request semantics', () => {
  assert.deepEqual(withToast(), { toast: { success: true, error: true, successMessage: undefined, errorMessage: undefined } });
  assert.deepEqual(withToast({ success: false, errorMessage: 'Try again.' }), { toast: { success: false, error: true, successMessage: undefined, errorMessage: 'Try again.' } });
});

test('route snapshot parent resolution ignores empty wrapper routes', () => {
  const root = { url: [], firstChild: { url: [{ path: 'catalog' }], firstChild: { url: [], firstChild: { url: ['orders', { path: '42' }] } } } };
  assert.equal(resolveParentPathFromRootSnapshot(root), '/catalog');
  assert.equal(resolveParentPathFromRootSnapshot({ url: [], firstChild: { url: ['overview'] } }), null);
});

test('header greeting helpers match canonical names, periods, pools and stable choice', () => {
  assert.equal(headerGreetingFirstName('  Ada   Lovelace '), 'Ada');
  assert.equal(headerGreetingFirstName('   '), '');
  const at = hour => new Date(2026, 7, 28, hour, 0, 0);
  assert.deepEqual([0, 5, 7, 9, 12, 14, 17, 19, 22].map(hour => headerGreetingPeriod(at(hour))), ['wee-hours', 'dawn', 'early-morning', 'morning', 'midday', 'afternoon', 'dusk', 'evening', 'late-night']);
  assert.equal(headerGreetingPool('morning').length, 12);
  assert.equal(headerGreetingPool('morning', { kind: 'rain' }).length, 20);
  assert.equal(headerGreetingPool('morning', { kind: 'clear', temperatureC: 35 }).length, 18);
  assert.deepEqual(pickHeaderGreeting('Ada Lovelace', at(10)), pickHeaderGreeting('Ada Lovelace', at(10)));
  assert.equal(pickHeaderGreeting('Ada Lovelace', at(10))?.name, 'Ada');
  assert.equal(pickHeaderGreeting(null), null);
});

test('framework-neutral runtime constructors replace Angular component and panel symbols', () => {
  for (const constructor of [ConfirmDialogComponent, FilterDrawerPanel, NotificationDrawerPanel, AppShellHeaderComponent, AppShellContentHeaderComponent]) assert.equal(typeof constructor, 'function');
});
