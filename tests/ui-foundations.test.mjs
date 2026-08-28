import assert from 'node:assert/strict';
import test from 'node:test';

import { AFRICANIES_UI_ELEMENTS, AlertComponent, AsyncStateComponent, ButtonComponent, ChipComponent, CopyButtonComponent, UI_PACKAGE_NAME, defineAfricaniesElements, resolveAsyncView } from '../packages/ui/dist/index.js';

function createShadowRootStub() {
  return {
    innerHTML: '',
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

test('UI package imports without browser globals and exposes the complete foundation registry', () => {
  assert.equal(UI_PACKAGE_NAME, '@africanies/africanies-ui');
  assert.deepEqual(Object.keys(AFRICANIES_UI_ELEMENTS), [
    'africanies-text-input', 'africanies-textarea', 'africanies-number-input', 'africanies-checkbox', 'africanies-radio',
    'africanies-toggle', 'africanies-date-picker', 'africanies-otp-input', 'africanies-select', 'africanies-search-combobox',
    'africanies-breadcrumb', 'africanies-tabs', 'africanies-segment', 'africanies-shipping-mode-switch', 'africanies-side-nav',
    'africanies-table', 'africanies-pagination', 'africanies-stepper', 'africanies-page-header',
    'africanies-action-menu', 'africanies-action-menu-trigger', 'africanies-avatar', 'africanies-avatar-menu',
    'africanies-brand-logo', 'africanies-image', 'africanies-image-fallback-frame', 'africanies-carrier-logo', 'africanies-tooltip',
    'africanies-info-popover', 'africanies-app-shell', 'africanies-app-shell-header', 'africanies-app-shell-content-header', 'africanies-header', 'africanies-content-header',
    'africanies-notification-drawer', 'africanies-filter-drawer',
    'africanies-address-input', 'africanies-file-upload', 'africanies-file-preview-dialog', 'africanies-camera-capture-dialog',
    'africanies-button', 'africanies-copy', 'africanies-copy-button', 'africanies-loading', 'africanies-empty', 'africanies-error',
    'africanies-async-state', 'africanies-error-indicator', 'africanies-accordion', 'africanies-alert', 'africanies-chip', 'africanies-content-stack',
    'africanies-toast-item', 'africanies-toast-host', 'africanies-overlay-frame', 'africanies-confirm-dialog'
  ]);
});

test('custom element registration is explicit, complete and idempotent', () => {
  const definitions = new Map();
  const registry = { define: (name, constructor) => definitions.set(name, constructor), get: (name) => definitions.get(name) };
  assert.equal(defineAfricaniesElements(undefined).length, 0);
  assert.equal(defineAfricaniesElements(registry).length, 56);
  assert.equal(defineAfricaniesElements(registry).length, 0);
  assert.equal(Object.getPrototypeOf(definitions.get('africanies-copy-button').prototype), CopyButtonComponent.prototype);
});

test('foundation components publish observed accessibility and state attributes', () => {
  assert.ok(AsyncStateComponent.observedAttributes.includes('state'));
  assert.ok(CopyButtonComponent.observedAttributes.includes('aria-label'));
});

test('canonical foundation contracts use Angular public names while retaining legacy aliases', () => {
  assert.ok(ButtonComponent.observedAttributes.includes('variant'));
  assert.ok(ButtonComponent.observedAttributes.includes('size'));
  assert.ok(CopyButtonComponent.observedAttributes.includes('label'));
  assert.ok(CopyButtonComponent.observedAttributes.includes('copied-label'));
  assert.ok(CopyButtonComponent.observedAttributes.includes('feedback-ms'));
  assert.ok(CopyButtonComponent.observedAttributes.includes('announce'));
  assert.ok(AlertComponent.observedAttributes.includes('variant'));
  assert.ok(AlertComponent.observedAttributes.includes('title'));
  assert.ok(AlertComponent.observedAttributes.includes('message'));
  assert.ok(ChipComponent.observedAttributes.includes('variant'));
  assert.ok(ChipComponent.observedAttributes.includes('size'));
  assert.ok(ChipComponent.observedAttributes.includes('remove-label'));
  assert.equal(AFRICANIES_UI_ELEMENTS['africanies-copy'], CopyButtonComponent);
  const alert = new AlertComponent();
  const attributes = new Map([['variant', 'success'], ['message', 'Done']]);
  alert.renderRoot = createShadowRootStub();
  alert.getAttribute = (name) => attributes.get(name) ?? null;
  alert.hasAttribute = (name) => attributes.has(name);
  alert.render();
  assert.match(alert.renderRoot.innerHTML, /africanies-icon/);
  assert.match(alert.renderRoot.innerHTML, /name="check-circle"/);
});

test('async state branch precedence matches the canonical Angular wrapper', () => {
  assert.deepEqual(resolveAsyncView({ data: ['stale'], isLoading: true, isFetching: true, isError: true, error: 'bad' }), { kind: 'loading' });
  assert.deepEqual(resolveAsyncView({ data: undefined, isLoading: false, isFetching: false, isError: true, error: 'bad' }), { kind: 'error', message: 'bad' });
  assert.deepEqual(resolveAsyncView({ data: [], isLoading: false, isFetching: false, isError: false, error: null }), { kind: 'empty' });
  assert.deepEqual(resolveAsyncView({ data: {}, isLoading: false, isFetching: true, isError: true, error: null }), { kind: 'content', staleError: true, fetching: true });
});

test('copy button reports unavailable clipboard as a safe failure', async () => {
  const component = new CopyButtonComponent();
  assert.equal(await component.copy(), false);
});
