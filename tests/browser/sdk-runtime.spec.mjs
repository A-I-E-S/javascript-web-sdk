import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/#/overview');
  await page.evaluate(async () => {
    const ui = await import('/packages/ui/dist/index.js');
    ui.defineAfricaniesElements();
  });
});

test('all registered SDK elements connect and render real DOM', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { AFRICANIES_UI_ELEMENTS } = await import('/packages/ui/dist/index.js');
    const failures = [];
    for (const name of Object.keys(AFRICANIES_UI_ELEMENTS)) {
      try {
        const element = document.createElement(name);
        document.body.append(element);
        await Promise.resolve();
        if (!element.shadowRoot) failures.push(`${name}: no rendered shadow root`);
        element.remove();
      } catch (error) {
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return failures;
  });
  expect(result).toEqual([]);
});

test('form controls, search combobox and navigation emit usable DOM events', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const input = document.createElement('africanies-text-input');
    input.setAttribute('name', 'reference');
    document.body.append(input);
    let inputs = 0;
    input.addEventListener('input', () => inputs++);
    const native = input.shadowRoot.querySelector('input');
    native.value = 'REF-100';
    native.dispatchEvent(new Event('input', { bubbles: true }));

    const search = document.createElement('africanies-search-combobox');
    search.options = [{ label: 'Lagos', value: 'LOS' }];
    document.body.append(search);
    let changes = 0;
    search.addEventListener('change', () => changes++);
    search.shadowRoot.querySelector('[role="option"]').click();

    const tabs = document.createElement('africanies-tabs');
    tabs.tabs = [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }];
    document.body.append(tabs);
    tabs.shadowRoot.querySelector('[data-id="two"]').click();
    return { inputValue: input.value, inputs, searchValue: search.value, changes, selected: tabs.selected };
  });
  expect(result).toEqual({ inputValue: 'REF-100', inputs: 1, searchValue: 'LOS', changes: 1, selected: 'two' });
});

test('popover, filter drawer, toast and modal remain interactive after rerenders', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const ui = await import('/packages/ui/dist/index.js');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    const popover = document.createElement('africanies-info-popover');
    document.body.append(popover);
    popover.shadowRoot.querySelector('button').click();
    const opened = popover.hasAttribute('open');
    popover.shadowRoot.querySelector('button').click();
    const closed = !popover.hasAttribute('open');

    const filter = document.createElement('africanies-filter-drawer');
    filter.initial = { status: 'pending' };
    document.body.append(filter);
    let applied = null;
    filter.addEventListener('filter-apply', event => { applied = event.detail; });
    filter.shadowRoot.querySelector('[data-action="apply"]').click();

    const toast = new ui.ToastService({ document });
    const toastId = toast.success('Saved');
    const host = document.querySelector('africanies-toast-host');
    await Promise.resolve();
    const renderedToast = host?.shadowRoot?.querySelector('africanies-toast-item');

    const modal = new ui.ModalService({ document });
    const content = document.createElement('button');
    content.textContent = 'Inside';
    const ref = modal.open(content, { dismissible: true });
    const focusedInside = document.activeElement === content;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await ref.closed;
    toast.destroy();
    return { opened, closed, applied, toastId, renderedToast: Boolean(renderedToast), focusedInside, modalClosed: ref.isClosed };
  });
  expect(result).toEqual({ opened: true, closed: true, applied: { status: 'pending' }, toastId: 'africanies-toast-1', renderedToast: true, focusedInside: true, modalClosed: true });
});

test('icon registration fetches one sprite and renders a real SVG use element', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const icons = await import('/packages/icons/dist/index.js');
    let fetches = 0;
    icons.defineAfricaniesIcon({
      document,
      HTMLElement,
      customElements,
      tagName: 'africanies-runtime-icon',
      spriteUrl: '/runtime-icons.svg',
      fetch: async () => ({ ok: true, text: async () => '<svg><symbol id="truck"></symbol></svg>' , status: 200 })
    });
    const first = document.createElement('africanies-runtime-icon');
    first.setAttribute('name', 'truck');
    const second = document.createElement('africanies-runtime-icon');
    second.setAttribute('name', 'truck');
    document.body.append(first, second);
    await new Promise(resolve => setTimeout(resolve, 0));
    fetches = document.querySelectorAll('#africanies-icon-sprite').length;
    return { spriteContainers: fetches, use: first.querySelector('use')?.getAttribute('href') };
  });
  expect(result).toEqual({ spriteContainers: 1, use: '#truck' });
});

test('umbrella registration includes the icon dependency used by SDK UI', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const sdk = await import('/packages/sdk/dist/africanies-web-sdk.esm.js');
    sdk.defineAfricaniesElements({
      document,
      HTMLElement,
      registry: customElements,
      iconSpriteUrl: '/sdk-test-icons.svg',
      fetch: async () => ({ ok: true, status: 200, text: async () => '<svg><symbol id="check"></symbol></svg>' })
    });
    const icon = document.createElement('africanies-icon');
    icon.setAttribute('name', 'check');
    document.body.append(icon);
    await new Promise(resolve => setTimeout(resolve, 0));
    return { registered: Boolean(customElements.get('africanies-icon')), use: icon.querySelector('use')?.getAttribute('href') };
  });
  expect(result).toEqual({ registered: true, use: '#check' });
});

test('theme and shipping mode services drive observable document state', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const sdk = await import('/packages/sdk/dist/africanies-web-sdk.esm.js');
    const storage = { value: null, get() { return this.value; }, set(_key, value) { this.value = value; } };
    const theme = new sdk.ThemeService({ document, storage });
    theme.setTheme('dark');
    const mode = new sdk.ShippingModeService({ get: () => null, set() {}, remove() {}, clear() {} });
    const unbind = sdk.bindShippingModeToDocument(mode, document);
    await mode.setMode('stn');
    const state = { dark: document.documentElement.classList.contains('dark'), colorScheme: document.documentElement.style.colorScheme, mode: document.documentElement.dataset.africaniesMode };
    unbind();
    return { ...state, modeAfterUnbind: document.documentElement.dataset.africaniesMode ?? null };
  });
  expect(result).toEqual({ dark: true, colorScheme: 'dark', mode: 'stn', modeAfterUnbind: null });
});

test('translated image and accordion components expose real interactive states', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const image = document.createElement('africanies-image');
    image.setAttribute('fallback', 'IK');
    document.body.append(image);
    const fallback = image.shadowRoot.querySelector('[part="fallback"]')?.textContent;
    image.setAttribute('src', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
    await new Promise(resolve => setTimeout(resolve, 20));
    const placeholderHidden = !image.shadowRoot.querySelector('[part="placeholder"]');

    const accordion = document.createElement('africanies-accordion');
    accordion.setAttribute('heading', 'Shipment details');
    document.body.append(accordion);
    let changes = 0;
    accordion.addEventListener('open-change', () => changes++);
    accordion.shadowRoot.querySelector('button').click();
    const open = accordion.hasAttribute('open') && !accordion.shadowRoot.querySelector('[part="panel"]').hidden;
    return { fallback, placeholderHidden, open, changes };
  });
  expect(result).toEqual({ fallback: 'IK', placeholderHidden: true, open: true, changes: 1 });
});

test('final parity components render and preserve confirm and panel behavior', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const ui = await import('/packages/ui/dist/index.js');
    const header = document.createElement('africanies-app-shell-header');
    header.setAttribute('greeting-name', 'Ada Lovelace');
    header.setAttribute('show-clock', 'false');
    document.body.append(header);
    const contentHeader = document.createElement('africanies-app-shell-content-header');
    contentHeader.setAttribute('title', 'Orders');
    contentHeader.setAttribute('back-href', '/catalog');
    document.body.append(contentHeader);

    const modal = new ui.ModalService({ document });
    let attempts = 0;
    const confirmPromise = new ui.ConfirmService(modal).confirm({ message: 'Continue?', danger: true, onConfirm: async () => { attempts += 1; if (attempts === 1) throw new Error('retry'); } });
    const dialog = document.querySelector('africanies-confirm-dialog');
    let errors = 0;
    dialog.addEventListener('confirm-error', () => errors++);
    dialog.shadowRoot.querySelector('[data-action="confirm"]').click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const stayedOpen = Boolean(document.querySelector('africanies-confirm-dialog')) && dialog.loading === false;
    dialog.shadowRoot.querySelector('[data-action="confirm"]').click();
    const confirmed = await confirmPromise;

    const filter = document.createElement('africanies-filter-drawer');
    document.body.append(filter);
    filter.initial = { state: 'open' };
    let reset = null; let filterClosed = 0;
    filter.addEventListener('filter-apply', event => { reset = event.detail; });
    filter.addEventListener('panel-close', () => filterClosed++);
    filter.reset(); filter.close();
    const notifications = document.createElement('africanies-notification-drawer');
    document.body.append(notifications);
    let notificationClosed = 0;
    notifications.addEventListener('panel-close', () => notificationClosed++);
    notifications.close();
    return { greeting: header.shadowRoot.querySelector('[part="greeting"] strong')?.textContent, title: contentHeader.shadowRoot.querySelector('h1')?.textContent, back: contentHeader.shadowRoot.querySelector('[part="back"]')?.getAttribute('href'), stayedOpen, errors, attempts, confirmed, reset, filterClosed, notificationClosed };
  });
  expect(result).toEqual({ greeting: 'Ada', title: 'Orders', back: '/catalog', stayedOpen: true, errors: 1, attempts: 2, confirmed: true, reset: {}, filterClosed: 1, notificationClosed: 1 });
});

test('SDK table, filter, modal, toast and shipping switch retain canonical control geometry', async ({ page }) => {
  const result = await page.evaluate(async () => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    const table = document.createElement('africanies-table');
    table.columns = [{ key: 'tracking', label: 'Tracking', sortable: true }];
    table.rows = [{ tracking: 'AFR-1' }];
    document.body.append(table);
    const sort = table.shadowRoot.querySelector('[data-sort]');
    const sortStyle = getComputedStyle(sort);

    const filter = document.createElement('africanies-filter-drawer');
    document.body.append(filter);
    const filterActions = getComputedStyle(filter.shadowRoot.querySelector('[part="actions"]'));

    const toast = document.createElement('africanies-toast-item');
    toast.item = { id: 'one', message: 'Saved', variant: 'success', count: 1, expanded: false };
    document.body.append(toast);
    const dismissStyle = getComputedStyle(toast.shadowRoot.querySelector('[part="dismiss"]'));

    const mode = document.createElement('africanies-shipping-mode-switch');
    mode.setAttribute('mode', 'stn');
    document.body.append(mode);
    const radios = [...mode.shadowRoot.querySelectorAll('[role="radio"]')];
    const selectedStyle = radios[0] ? getComputedStyle(radios[0]) : null;
    const idleStyle = radios[1] ? getComputedStyle(radios[1]) : null;
    const selectedBg = selectedStyle?.backgroundColor ?? null;
    const idleBg = idleStyle?.backgroundColor ?? null;
    const darkContext = document.createElement('div');
    darkContext.className = 'dark';
    mode.replaceWith(darkContext);
    darkContext.append(mode);
    await new Promise(resolve => requestAnimationFrame(() => resolve()));
    const darkRadios = [...mode.shadowRoot.querySelectorAll('[role="radio"]')];
    const darkSelectedBg = darkRadios[0] ? getComputedStyle(darkRadios[0]).backgroundColor : null;
    const darkIdleBg = darkRadios[1] ? getComputedStyle(darkRadios[1]).backgroundColor : null;
    const tileWidths = darkRadios.map(radio => Math.round(radio.getBoundingClientRect().width));
    darkContext.replaceWith(mode);
    return {
      sort: { border: sortStyle.borderStyle, minHeight: sortStyle.minHeight, paddingLeft: sortStyle.paddingLeft, background: sortStyle.backgroundColor },
      filterDisplay: filterActions.display,
      dismiss: { width: dismissStyle.width, height: dismissStyle.height, minHeight: dismissStyle.minHeight },
      mode: { count: radios.length, groupRole: mode.shadowRoot.querySelector('[role="radiogroup"]')?.getAttribute('role') ?? null, firstLabel: radios[0]?.getAttribute('aria-label') ?? null, selected: radios[0]?.getAttribute('aria-checked') ?? null, idle: radios[1]?.getAttribute('aria-checked') ?? null, selectedBg, idleBg, darkSelectedBg, darkIdleBg, equalWidth: tileWidths[0] === tileWidths[1] }
    };
  });
  expect(result.sort).toEqual({ border: 'none', minHeight: '0px', paddingLeft: '0px', background: 'rgba(0, 0, 0, 0)' });
  expect(result.filterDisplay).toBe('flex');
  expect(result.dismiss).toEqual({ width: '32px', height: '32px', minHeight: '0px' });
  expect(result.mode).toEqual({ count: 2, groupRole: 'radiogroup', firstLabel: 'Shipping to Nigeria', selected: 'true', idle: 'false', selectedBg: 'rgb(240, 136, 41)', idleBg: 'rgb(255, 255, 255)', darkSelectedBg: 'rgb(240, 136, 41)', darkIdleBg: 'rgb(16, 24, 39)', equalWidth: true });
});
