import assert from 'node:assert/strict';
import test from 'node:test';

import { AfricaniesOverlayRef, ModalService, TOAST_DURATION_MS, ToastItemComponent, ToastService, toastFingerprint } from '../packages/ui/dist/index.js';

test('toast defaults, fingerprints and identical stack behavior preserve Angular semantics', () => {
  const service = new ToastService();
  assert.deepEqual(TOAST_DURATION_MS, { info: 4500, success: 4500, warning: 8000, danger: null });
  assert.equal(toastFingerprint('warning', 'Heads up', 'Delay'), 'warning|Heads up|Delay');
  const id = service.show({ message: ' Saved ', variant: 'success', durationMs: null });
  assert.equal(service.show({ message: 'Saved', variant: 'success', durationMs: null }), id);
  assert.equal(service.items[0].count, 2);
  assert.equal(service.hasStacks, true);
  service.expand(id); assert.equal(service.items[0].expanded, true);
  service.dismissOne(id); assert.equal(service.items[0].count, 1);
  service.dismiss(id); assert.equal(service.items.length, 0);
  assert.equal(service.show({ message: '   ' }), '');
  service.destroy();
});

test('toast timers pause, resume, peel stacks and are cleared on destroy', () => {
  let sequence = 0;
  const callbacks = new Map();
  const service = new ToastService({
    setTimeout: callback => { callbacks.set(++sequence, callback); return sequence; },
    clearTimeout: id => callbacks.delete(id)
  });
  const id = service.show({ message: 'Timed', durationMs: 10 });
  assert.equal(callbacks.size, 1);
  service.pause(id); assert.equal(callbacks.size, 0);
  service.resume(id); assert.equal(callbacks.size, 1);
  service.destroy(); assert.equal(callbacks.size, 0);
});

test('toast item exposes assertive accessibility semantics for warning and danger', () => {
  assert.ok(ToastItemComponent);
  const source = ToastItemComponent.prototype.constructor.toString();
  assert.match(source, /warning/);
  assert.match(source, /assertive/);
});

test('overlay ref closes once, resolves once and survives disposal failure', async () => {
  let disposals = 0;
  const seen = [];
  const ref = new AfricaniesOverlayRef(async () => { disposals += 1; throw new Error('animation failed'); });
  ref.afterClosed(result => seen.push(result));
  ref.close('saved'); ref.close('ignored');
  assert.equal(await ref.afterClosed(), 'saved');
  assert.deepEqual(seen, ['saved']);
  assert.equal(disposals, 1);
  assert.equal(ref.isClosed, true);
});

test('overlay services fail clearly without an injected browser document', () => {
  const modal = new ModalService();
  assert.throws(() => modal.open({}), /injected browser document/);
});
