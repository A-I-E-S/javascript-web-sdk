import assert from 'node:assert/strict';
import test from 'node:test';

import { AFRICANIES_UI_ELEMENTS, AsyncStateComponent, CopyButtonComponent, UI_PACKAGE_NAME, defineAfricaniesElements } from '../packages/ui/dist/index.js';

test('UI package imports without browser globals and exposes the complete foundation registry', () => {
  assert.equal(UI_PACKAGE_NAME, '@africanies/africanies-ui');
  assert.deepEqual(Object.keys(AFRICANIES_UI_ELEMENTS), [
    'africanies-text-input', 'africanies-textarea', 'africanies-number-input', 'africanies-checkbox', 'africanies-radio',
    'africanies-toggle', 'africanies-date-picker', 'africanies-otp-input', 'africanies-select', 'africanies-search-combobox',
    'africanies-breadcrumb', 'africanies-tabs', 'africanies-segment', 'africanies-shipping-mode-switch', 'africanies-side-nav',
    'africanies-table', 'africanies-pagination', 'africanies-stepper', 'africanies-page-header',
    'africanies-action-menu', 'africanies-action-menu-trigger', 'africanies-avatar', 'africanies-avatar-menu',
    'africanies-brand-logo', 'africanies-image-fallback-frame', 'africanies-carrier-logo', 'africanies-tooltip',
    'africanies-info-popover', 'africanies-app-shell', 'africanies-header', 'africanies-content-header',
    'africanies-notification-drawer', 'africanies-filter-drawer',
    'africanies-address-input', 'africanies-file-upload', 'africanies-file-preview-dialog', 'africanies-camera-capture-dialog',
    'africanies-button', 'africanies-copy-button', 'africanies-loading', 'africanies-empty', 'africanies-error',
    'africanies-async-state', 'africanies-error-indicator', 'africanies-alert', 'africanies-chip', 'africanies-content-stack',
    'africanies-toast-item', 'africanies-toast-host', 'africanies-overlay-frame'
  ]);
});

test('custom element registration is explicit, complete and idempotent', () => {
  const definitions = new Map();
  const registry = { define: (name, constructor) => definitions.set(name, constructor), get: (name) => definitions.get(name) };
  assert.equal(defineAfricaniesElements(undefined).length, 0);
  assert.equal(defineAfricaniesElements(registry).length, 50);
  assert.equal(defineAfricaniesElements(registry).length, 0);
  assert.equal(definitions.get('africanies-copy-button'), CopyButtonComponent);
});

test('foundation components publish observed accessibility and state attributes', () => {
  assert.ok(AsyncStateComponent.observedAttributes.includes('state'));
  assert.ok(CopyButtonComponent.observedAttributes.includes('aria-label'));
});

test('copy button reports unavailable clipboard as a safe failure', async () => {
  const component = new CopyButtonComponent();
  assert.equal(await component.copy(), false);
});
