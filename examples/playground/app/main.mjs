import { matchRoute } from './routes.mjs';
import { DISABLED_ROUTES, NAV_ITEMS, renderShell, resolveShellMeta, updateActiveLinks, updateBreadcrumbs } from './shell.mjs';
import { applyUtilities, utilities } from './styles.mjs';

const sdkModulePath = '../../../packages/sdk/dist/africanies-web-sdk.esm.js';
let sdk;
try {
  sdk = await import(sdkModulePath);
  sdk.defineAfricaniesElements();
  document.documentElement.dataset.sdk = 'registered';
} catch {
  document.documentElement.dataset.sdk = 'unavailable';
}

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app root');
app.innerHTML = renderShell();

const jsonStorage = {
  get(key) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? null : JSON.parse(value);
    } catch {
      return null;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const responseCache = sdk ? new sdk.HttpResponseCache() : null;
const authTokenService = sdk ? new sdk.AuthTokenService(undefined, responseCache) : null;
const themeService = sdk ? new sdk.ThemeService({ document, storage: jsonStorage, storageKey: 'africanies-playground-theme' }) : null;
const shippingModeService = sdk ? new sdk.ShippingModeService(undefined, responseCache) : null;
const toastService = sdk ? new sdk.ToastService({ document }) : null;
const modalService = sdk ? new sdk.ModalService({ document }) : null;
const drawerService = sdk ? new sdk.DrawerService({ document }) : null;
const confirmService = sdk ? new sdk.ConfirmService(modalService) : null;
const filterQueryService = sdk ? new sdk.FilterQueryService(history, location) : null;
const filterResolver = { resolve: async () => ({ shipment_status: [{ label: 'In process', value: 'in-process' }] }) };
const filterDrawerService = sdk ? new sdk.FilterDrawerService(drawerService, filterQueryService, filterResolver) : null;
const notificationAdapter = {
  list: async (page) => ({
    data: [{ id: `notice-${page}`, title: 'Shipment update', message: 'AFR-102948 departed Lagos', read: false }],
    has_next_page: page < 2
  }),
  markRead: async (id) => ({ id, read: true })
};
const notificationDrawerService = sdk ? new sdk.NotificationDrawerService(drawerService, notificationAdapter) : null;

const NAV_STORAGE_KEY = 'africanies-playground-nav-state';
const storedNavState = jsonStorage.get(NAV_STORAGE_KEY) ?? {};
const defaultOpenParents = NAV_ITEMS.filter((item) => item.children?.length).map((item) => item.id);
const state = {
  mode: shippingModeService?.getMode() ?? 'sfn',
  theme: themeService?.getTheme() ?? 'light',
  navCollapsed: storedNavState.collapsed === true,
  openParents: new Set(Array.isArray(storedNavState.openParents) && storedNavState.openParents.length ? storedNavState.openParents : defaultOpenParents),
  mobileOpen: false,
  weather: null,
  lastFocus: null,
  clockTimer: null,
  accessTokenOpen: false,
  accountMenuOpen: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const isDisabledRoute = (pathname) => DISABLED_ROUTES.has(pathname);
const rawPath = () => location.hash.replace(/^#/, '') || '/overview';
const path = () => {
  const pathname = rawPath();
  if (isDisabledRoute(pathname)) return '/overview';
  return pathname;
};
const modeClasses = (mode = state.mode) => mode === 'stn'
  ? {
      accentBg: 'bg-import',
      accentText: 'text-import',
      accentHover: 'hover:bg-import-subtle dark:hover:bg-import/15',
      accentSoft: 'bg-import-subtle dark:bg-import/15',
      accentStrong: 'bg-import text-white hover:bg-import-light'
    }
  : {
      accentBg: 'bg-export',
      accentText: 'text-export',
      accentHover: 'hover:bg-export-subtle dark:hover:bg-export/15',
      accentSoft: 'bg-export-subtle dark:bg-export/15',
      accentStrong: 'bg-export text-white hover:bg-export-light'
    };

function persistNavState() {
  jsonStorage.set(NAV_STORAGE_KEY, {
    collapsed: state.navCollapsed,
    openParents: [...state.openParents]
  });
}

function renderIcon(name, size = 16, className = '') {
  return `<africanies-icon name="${name}" size="${size}" class="${className}" aria-hidden="true"></africanies-icon>`;
}

function syncTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.classList.toggle('dark', state.theme === 'dark');
  const theme = $('#theme-toggle');
  if (theme) {
    const dark = state.theme === 'dark';
    theme.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
    theme.innerHTML = `${renderIcon(dark ? 'alarm' : 'adjust', 14)}<span id="theme-toggle-label">${dark ? 'Light' : 'Dark'}</span>`;
  }
}

function syncClock() {
  const now = new Date();
  const time = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(now);
  const date = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(now);
  const clock = $('#header-clock');
  const dateLabel = $('#header-date');
  clock?.setAttribute('datetime', now.toISOString());
  if (clock) clock.textContent = time;
  dateLabel?.setAttribute('datetime', now.toISOString());
  if (dateLabel) dateLabel.textContent = date;
  const greeting = sdk?.pickHeaderGreeting?.('Amara Okafor', now, state.weather) ?? sdk?.pickHeaderGreeting?.('Amara Okafor', now) ?? { kicker: 'Morning momentum.', name: 'Amara' };
  $('#header-kicker') && ($('#header-kicker').textContent = greeting?.kicker ?? 'Morning momentum.');
  $('#header-name') && ($('#header-name').textContent = greeting?.name ?? 'Amara');
}

function syncWeather() {
  const icon = $('#header-weather africanies-icon');
  const temp = $('#header-weather-temp');
  const place = $('#header-weather-place');
  if (!icon || !temp || !place) return;
  if (!state.weather) {
    icon.setAttribute('name', 'cloud-o');
    temp.textContent = '--°';
    place.textContent = 'Weather unavailable';
    return;
  }
  icon.setAttribute('name', headerWeatherIcon(state.weather.kind, new Date().getHours()));
  temp.textContent = `${Math.round(state.weather.temperatureC ?? 0)}°`;
  place.textContent = state.weather.city ?? headerWeatherLabel(state.weather.kind);
}

function syncAccessTokenState() {
  const token = authTokenService?.getToken?.() ?? authTokenService?.get?.() ?? null;
  const hasToken = Boolean(token);
  const button = $('#access-token');
  const label = $('#access-token-label');
  const dot = $('#access-token-dot');
  const clearButton = $('#access-token-clear');
  const message = $('#access-token-message');
  const input = $('#access-token-input');
  if (button) button.setAttribute('aria-expanded', String(state.accessTokenOpen));
  if (label) label.textContent = hasToken ? 'Connected' : 'API token';
  if (dot) {
    dot.className = `size-1.5 shrink-0 rounded-full ${hasToken ? 'bg-export shadow-[0_0_0_2px] shadow-export/25' : 'bg-warning shadow-[0_0_0_2px] shadow-warning/25'}`;
  }
  if (clearButton) clearButton.toggleAttribute('disabled', !hasToken);
  if (message) message.textContent = hasToken ? `Requests include your saved token (••••${String(token).slice(-4)}). Replace below to update.` : 'Live SDK calls need a bearer token from the test API.';
  if (input && !state.accessTokenOpen) input.value = '';
}

function syncActiveNavStyles() {
  const colors = modeClasses();
  const activeBg = state.mode === 'stn' ? 'bg-import-subtle' : 'bg-export-subtle';
  const activeText = state.mode === 'stn' ? 'text-import' : 'text-export';
  const darkSolid = state.mode === 'stn' ? 'dark:bg-[color-mix(in_srgb,#f08829_15%,#212529)]' : 'dark:bg-[color-mix(in_srgb,#1cbd5d_15%,#212529)]';
  $$('[data-nav-row],[data-nav-flyout-link],[data-nav-mobile-id]').forEach((element) => {
    element.classList.remove('bg-export-subtle', 'bg-import-subtle', 'text-export', 'text-import', 'dark:bg-[color-mix(in_srgb,#1cbd5d_15%,#212529)]', 'dark:bg-[color-mix(in_srgb,#f08829_15%,#212529)]', 'font-semibold');
    const active = element.getAttribute('data-active');
    if (!active) return;
    element.classList.add(activeBg, activeText, darkSolid, 'font-semibold');
  });
}

function syncHeaderState() {
  const colors = modeClasses();
  for (const accent of ['#header-accent', '#side-nav-accent']) {
    const element = $(accent);
    if (!element) continue;
    element.classList.remove('bg-export', 'bg-import');
    element.classList.add(colors.accentBg);
  }
  $$('[data-mode-flyout]').forEach((element) => {
    element.classList.remove('bg-export', 'bg-import');
    element.classList.add(colors.accentBg);
  });
  const buttons = $$('[data-mode]');
  for (const button of buttons) {
    const selected = button.getAttribute('data-mode') === state.mode;
    button.className = selected
      ? `rounded-md px-3 py-2 text-sm font-medium transition-colors ${colors.accentStrong}`
      : `rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-background-welcome dark:text-neutral-400 dark:hover:bg-white/10`;
    button.setAttribute('aria-pressed', String(selected));
  }
  const unread = 1;
  const badge = $('#notification-badge');
  if (badge) {
    badge.textContent = String(unread);
    badge.classList.toggle('hidden', unread < 1);
    badge.classList.toggle('inline-flex', unread > 0);
  }
  $('#notifications')?.setAttribute('aria-label', unread > 0 ? `Open notifications, ${unread} unread` : 'Open notifications');
  syncTheme();
  syncAccessTokenState();
  syncClock();
  syncWeather();
  syncActiveNavStyles();
}

function syncNavState() {
  const sideNav = $('#side-nav');
  if (!sideNav) return;
  sideNav.dataset.collapsed = String(state.navCollapsed);
  sideNav.style.width = state.navCollapsed ? '3.75rem' : '15rem';
  $('#brand-full')?.classList.toggle('hidden', state.navCollapsed);
  $('#brand-mini')?.classList.toggle('hidden', !state.navCollapsed);
  $('#brand-mini')?.classList.toggle('flex', state.navCollapsed);
  const collapseButton = $('#side-nav-collapse');
  if (collapseButton) {
    collapseButton.setAttribute('aria-label', state.navCollapsed ? 'Expand navigation' : 'Collapse navigation');
    collapseButton.setAttribute('aria-expanded', String(!state.navCollapsed));
    collapseButton.innerHTML = renderIcon(state.navCollapsed ? 'angle-double-right' : 'angle-double-left', 16, 'collapse-icon');
  }
  $$('.nav-label').forEach((element) => element.classList.toggle('hidden', state.navCollapsed));
  $$('[data-nav-parent]').forEach((button) => {
    const id = button.getAttribute('data-nav-parent');
    const open = state.openParents.has(id);
    button.setAttribute('aria-expanded', String(open));
    const chevron = button.querySelector('.nav-chevron');
    chevron?.classList.toggle('rotate-180', open && !state.navCollapsed);
  });
  $$('[data-nav-children]').forEach((panel) => {
    const id = panel.getAttribute('data-nav-children');
    const open = state.openParents.has(id) && !state.navCollapsed;
    panel.style.gridTemplateRows = open ? '1fr' : '0fr';
    panel.classList.toggle('pointer-events-none', !open);
    panel.setAttribute('aria-hidden', String(!open));
  });
  $$('[data-nav-mobile-children]').forEach((panel) => {
    const id = panel.getAttribute('data-nav-mobile-children');
    const open = state.openParents.has(id);
    panel.style.gridTemplateRows = open ? '1fr' : '0fr';
    panel.setAttribute('aria-hidden', String(!open));
    const toggle = $(`[data-nav-mobile-parent="${id}"]`);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.querySelector('africanies-icon:last-of-type')?.classList.toggle('rotate-180', open);
  });
  $('#side-nav-collapse-all')?.classList.toggle('hidden', state.navCollapsed || state.openParents.size === 0);
}

function openMobile() {
  state.mobileOpen = true;
  const panel = $('#mobile-navigation');
  if (panel) {
    panel.hidden = false;
    panel.classList.remove('hidden');
  }
  $('#mobile-navigation-toggle')?.setAttribute('aria-expanded', 'true');
}

function closeMobile() {
  state.mobileOpen = false;
  const panel = $('#mobile-navigation');
  if (panel) {
    panel.hidden = true;
    panel.classList.add('hidden');
  }
  $('#mobile-navigation-toggle')?.setAttribute('aria-expanded', 'false');
}

function openAccessTokenPanel() {
  state.accessTokenOpen = true;
  $('#access-token-panel')?.classList.remove('hidden');
  syncAccessTokenState();
  $('#access-token-input')?.focus();
}

function closeAccessTokenPanel() {
  state.accessTokenOpen = false;
  $('#access-token-panel')?.classList.add('hidden');
  syncAccessTokenState();
}

function openAccountMenu() {
  state.accountMenuOpen = true;
  $('#account-menu')?.setAttribute('aria-expanded', 'true');
  $('#account-menu-panel')?.classList.remove('hidden');
}

function closeAccountMenu() {
  state.accountMenuOpen = false;
  $('#account-menu')?.setAttribute('aria-expanded', 'false');
  $('#account-menu-panel')?.classList.add('hidden');
}

function toggleParent(id) {
  if (state.openParents.has(id)) state.openParents.delete(id);
  else state.openParents.add(id);
  persistNavState();
  syncNavState();
}

function normalizeRoute() {
  const current = rawPath();
  if (isDisabledRoute(current)) {
    const target = '#/overview';
    if (location.hash !== target) location.replace(target);
    return '/overview';
  }
  return current || '/overview';
}

function renderRoute() {
  const pathname = normalizeRoute();
  const matched = matchRoute(pathname);
  const target = $('#route-view');
  if (!target) return;
  target.innerHTML = matched
    ? matched.route.render(matched.params)
    : '<article class="not-found"><p class="eyebrow">404</p><h2>Page not found</h2><p>The requested playground route is unavailable.</p><a href="#/overview">Return to overview</a></article>';
  const activeParent = resolveShellMeta(pathname).trail.find((item) => NAV_ITEMS.some((candidate) => candidate.id === item.id && candidate.children?.length));
  if (activeParent) state.openParents.add(activeParent.id);
  updateBreadcrumbs(pathname);
  updateActiveLinks(pathname);
  syncNavState();
  syncActiveNavStyles();
  closeMobile();
  closeAccessTokenPanel();
  closeAccountMenu();
  target.scrollIntoView({ block: 'start' });
  configureSdkDemos();
  bindRoute();
}

export function showToast(tone = 'success', title = 'Shipment saved') {
  if (toastService) {
    toastService.show({ variant: tone === 'danger' ? 'danger' : tone, message: tone === 'danger' ? 'Please try again.' : 'Your action completed successfully.', title });
    return;
  }
  const region = $('#toast-region');
  if (!region) return;
  const item = document.createElement('article');
  item.className = utilities('toast', tone);
  item.innerHTML = `<strong>${title}</strong>`;
  region.append(item);
}

export function openOverlay(kind = 'modal', trigger = document.activeElement) {
  state.lastFocus = trigger;
  const root = $('#overlay-root');
  if (!root) return;
  const drawer = kind === 'drawer';
  root.innerHTML = applyUtilities(`<div class="overlay-backdrop" data-overlay-backdrop><section class="overlay ${drawer ? 'drawer' : ''}" role="dialog" aria-modal="true" aria-labelledby="overlay-title"><header class="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700"><div><p class="eyebrow">${kind === 'confirm' ? 'CONFIRM ACTION' : 'SHIPMENT'}</p><h2 id="overlay-title">${kind === 'confirm' ? 'Cancel shipment?' : drawer ? 'Shipment details' : 'Create shipment'}</h2></div><button class="icon-button" data-overlay-close aria-label="Close dialog">${renderIcon('close', 16)}</button></header><div class="overlay-body"><p>${kind === 'confirm' ? 'This cannot be undone. The customer will be notified.' : 'Keep focused work visible without leaving the current route.'}</p>${kind === 'modal' ? '<label><span>Shipment name</span><input class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800" autofocus placeholder="Weekly stock"></label>' : ''}</div><footer class="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">${btnHtml('Cancel', 'secondary', 'data-overlay-close')}${btnHtml(kind === 'confirm' ? 'Cancel shipment' : 'Continue', kind === 'confirm' ? 'danger' : 'primary', 'data-overlay-action')}</footer></section></div>`);
  const dialog = root.querySelector('[role="dialog"]');
  (dialog.querySelector('[autofocus]') || dialog.querySelector('button'))?.focus();
}

const btnHtml = (label, variant, attrs) => `<button type="button" class="${utilities('sdk-button', variant)}" ${attrs}>${label}</button>`;
function closeOverlay() {
  const root = $('#overlay-root');
  if (root) root.innerHTML = '';
  state.lastFocus?.focus?.();
  state.lastFocus = null;
}

function configureSdkDemos() {
  const actionMenu = $('[data-sdk-action-menu]');
  if (actionMenu) {
    actionMenu.items = [{ id: 'view', label: 'View shipment' }, { id: 'duplicate', label: 'Duplicate' }, { id: 'cancel', label: 'Cancel shipment', danger: true }];
    actionMenu.open = true;
  }
  const select = $('[data-sdk-select]');
  if (select) select.options = [{ label: 'Express air', value: 'express' }, { label: 'Ocean freight', value: 'ocean' }];
  const combo = $('[data-sdk-combobox]');
  if (combo) combo.options = [{ label: 'Nigeria', value: 'NG' }, { label: 'Kenya', value: 'KE' }, { label: 'Ghana', value: 'GH' }];
  const table = $('[data-sdk-table]');
  if (table) {
    table.columns = [{ key: 'tracking', label: 'Tracking', sortable: true }, { key: 'status', label: 'Status', sortable: true }, { key: 'route', label: 'Route' }];
    table.rows = [{ tracking: 'AFR-102948', status: 'In transit', route: 'LOS → NBO' }, { tracking: 'AFR-102771', status: 'Delivered', route: 'ACC → LOS' }];
  }
  const stepper = $('[data-sdk-stepper]');
  if (stepper) {
    stepper.steps = [{ id: 'address', label: 'Addresses' }, { id: 'package', label: 'Package' }, { id: 'service', label: 'Service' }, { id: 'review', label: 'Review' }];
    stepper.activeIndex = 1;
  }
  const tabs = $('[data-sdk-tabs]');
  if (tabs) {
    tabs.tabs = [{ id: 'overview', label: 'Overview' }, { id: 'documents', label: 'Documents' }, { id: 'events', label: 'Events' }];
    tabs.selected = path().split('/').at(-1);
  }
  const segment = $('[data-sdk-segment]');
  if (segment) {
    segment.tabs = [{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }];
    segment.selected = 'all';
  }
  const breadcrumb = $('[data-sdk-breadcrumb]');
  if (breadcrumb) breadcrumb.items = [{ href: '#/overview', label: 'Home' }, { href: path(), label: 'Navigation', current: true }];
  const filterPanel = $('[data-sdk-filter-panel]');
  if (filterPanel) {
    filterPanel.initial = { shipment_status: 'in-process' };
    filterPanel.resolveOptions = () => filterResolver.resolve(sdk.trackShipmentsFilterConfig);
    filterPanel.addEventListener('filter-apply', (event) => {
      const output = $('#sdk-filter-output');
      if (output) output.textContent = JSON.stringify(event.detail);
    });
  }
  const notificationPanel = $('[data-sdk-notification-panel]');
  if (notificationPanel) {
    notificationPanel.adapter = notificationAdapter;
    void notificationPanel.loadMore();
  }
  const parentOutput = $('#sdk-parent-output');
  if (parentOutput && sdk) {
    const snapshot = { url: ['components'], firstChild: { url: ['navigation'], firstChild: { url: ['overview'] } } };
    parentOutput.textContent = `parent: ${sdk.resolveParentPathFromRootSnapshot(snapshot)} · back: ${JSON.stringify(sdk.resolveContentBackTarget('/components/navigation', '/components/navigation/overview'))}`;
  }
  const greetingOutput = $('#sdk-greeting-output');
  if (greetingOutput && sdk) greetingOutput.textContent = JSON.stringify(sdk.pickHeaderGreeting('Amara Okafor', new Date('2026-08-28T09:00:00'), { kind: 'clear', temperatureC: 27, city: 'Lagos' }));
  const model = $('#sdk-model-output');
  if (model && sdk) model.textContent = JSON.stringify({ emptyFilter: sdk.emptyFilterState(), vendors: sdk.DELIVERY_VENDORS?.slice(0, 3) }, null, 2);
  const api = $('#sdk-api-output');
  if (api && sdk) api.textContent = JSON.stringify({ validEmail: sdk.isValidEmail('ops@africanies.com'), mode: sdk.asShippingMode('sfn'), csv: sdk.toCsvString({ headers: ['tracking', 'status'], rows: [['AFR-1', 'ready']] }) }, null, 2);
}

function bindRoute() {
  document.querySelectorAll('.dismiss-alert').forEach((element) => { element.onclick = () => element.closest('.alert')?.remove(); });
  document.querySelectorAll('.remove-chip').forEach((element) => { element.onclick = () => element.closest('.chip')?.remove(); });
  document.querySelectorAll('[data-open-overlay]').forEach((element) => { element.onclick = () => openOverlay(element.dataset.openOverlay, element); });
  document.querySelectorAll('[data-toast]').forEach((element) => { element.onclick = () => showToast(element.dataset.toast, `${element.dataset.toast[0].toUpperCase() + element.dataset.toast.slice(1)} notification`); });
  const menu = $('[data-action-menu]');
  if (menu) menu.onclick = () => {
    const pop = menu.nextElementSibling;
    const open = pop.hidden;
    pop.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    if (open) pop.querySelector('[role="menuitem"]')?.focus();
  };
  document.querySelectorAll('[data-feedback]').forEach((control) => {
    control.onclick = () => {
      document.querySelectorAll('[data-feedback]').forEach((item) => item.setAttribute('aria-pressed', String(item === control)));
      const preview = $('#feedback-preview');
      const values = {
        loading: [renderIcon('refresh', 30, 'animate-spin text-export'), 'Loading shipments', 'This will only take a moment.'],
        empty: [renderIcon('inbox', 30, 'text-neutral-400'), 'No shipments yet', 'Create a shipment to get started.'],
        error: [renderIcon('warning', 30, 'text-danger'), 'Unable to load shipments', 'Check your connection and try again.'],
        success: [renderIcon('check-circle', 30, 'text-export'), 'Shipments loaded', 'Everything is up to date.']
      }[control.dataset.feedback];
      preview.className = utilities('feedback-state', control.dataset.feedback);
      preview.innerHTML = applyUtilities(`<span class="feedback-symbol">${values[0]}</span><strong>${values[1]}</strong><p>${values[2]}</p>${control.dataset.feedback === 'error' ? btnHtml('Try again', 'secondary', 'data-feedback="loading"') : ''}`);
    };
  });
  document.querySelectorAll('[data-demo-submit]').forEach((element) => { element.onclick = (event) => { event.preventDefault(); showToast('success', 'Details saved'); }; });
  document.querySelectorAll('.copy-code').forEach((element) => { element.onclick = async () => { try { await navigator.clipboard.writeText(element.dataset.copy); showToast('success', 'Code copied'); } catch { showToast('danger', 'Copy failed'); } }; });
  document.querySelectorAll('[data-sort]').forEach((control) => { control.onclick = () => { const body = control.closest('table')?.querySelector('tbody'); const index = control.closest('th')?.cellIndex ?? 0; if (!body) return; const rows = [...body.rows].sort((a, b) => a.cells[index]?.textContent.localeCompare(b.cells[index]?.textContent)); body.replaceChildren(...rows); control.textContent = control.textContent.replace('↕', '↑'); }; });
  document.querySelectorAll('.table-tools .sdk-button').forEach((control) => { control.onclick = () => showToast('success', `CSV ready · ${sdk?.toCsvString?.([['tracking', 'status'], ['AFR-102948', 'in_transit']]).length ?? 0} bytes`); });
  document.querySelectorAll('.pagination button:not([disabled])').forEach((control) => { control.onclick = () => { const label = control.parentElement?.querySelector('span'); if (label) label.textContent = 'Page 2 of 3'; }; });
  $('[data-clear-filters]')?.addEventListener('click', () => { document.querySelectorAll('.filter-bar input').forEach((input) => { input.value = ''; }); showToast('info', 'Host filters cleared'); });
  const iconSearch = $('[data-icon-search]');
  if (iconSearch) iconSearch.oninput = () => document.querySelectorAll('[data-icon-name]').forEach((element) => { element.hidden = !element.dataset.iconName.includes(iconSearch.value.toLowerCase()); });
  document.querySelectorAll('[data-sdk-overlay]').forEach((control) => { control.onclick = async () => { const kind = control.dataset.sdkOverlay; if (kind === 'confirm') { const result = await confirmService?.confirm({ title: 'Cancel shipment?', message: 'This action cannot be undone.', danger: true }); showToast('info', `SDK confirm result: ${String(result)}`); return; } const service = kind === 'drawer' ? drawerService : modalService; service?.open(({ document: owner, ref }) => { const frame = owner.createElement('africanies-overlay-frame'); frame.innerHTML = '<strong slot="header">SDK overlay</strong><p>Opened by the SDK overlay service.</p><button slot="footer" type="button">Close</button>'; frame.querySelector('button')?.addEventListener('click', () => ref.close('closed')); return frame; }, { dismissible: true }); }; });
  document.querySelectorAll('[data-sdk-toast]').forEach((control) => { control.onclick = () => { const kind = control.dataset.sdkToast; if (kind === 'stack') { toastService?.success('Duplicate notification', 'SDK toast'); toastService?.success('Duplicate notification', 'SDK toast'); } else if (kind === 'error') toastService?.error('Persistent SDK error', 'Action failed'); else toastService?.success('Shipment saved', 'SDK toast'); }; });
  $('[data-sdk-with-toast]')?.addEventListener('click', () => { const output = $('#sdk-with-toast-output'); if (output) output.textContent = JSON.stringify(sdk.withToast({ successMessage: 'Shipment saved', errorMessage: 'Shipment failed' })); });
  $('[data-sdk-filter-drawer]')?.addEventListener('click', () => { const ref = filterDrawerService?.open(sdk.trackShipmentsFilterConfig); void ref?.closed.then((result) => { const output = $('#sdk-filter-output'); if (output) output.textContent = JSON.stringify(result ?? {}); }); });
  $('[data-sdk-notifications]')?.addEventListener('click', () => { notificationDrawerService?.open(); });
  $('[data-sdk-confirm-retry]')?.addEventListener('click', () => { let attempts = 0; const output = $('#sdk-confirm-output'); const onError = () => { if (output) output.textContent = 'Async error surfaced · retry available'; }; document.addEventListener('confirm-error', onError, { once: true }); void confirmService?.confirm({ title: 'Retryable confirmation', message: 'The first attempt fails; retry succeeds.', confirmLabel: 'Run async work', onConfirm: async () => { attempts += 1; await Promise.resolve(); if (attempts === 1) throw new Error('Simulated transient failure'); } }).then((result) => { if (output) output.textContent = `Confirmed after retry: ${result}`; }); });
  $('[data-sdk-form-submit]')?.addEventListener('click', (event) => { event.preventDefault(); const form = event.currentTarget.closest('form'); const output = $('#sdk-form-output'); if (output) output.textContent = JSON.stringify(Object.fromEntries(new FormData(form)), null, 2); });
  $('[data-sdk-filter-apply]')?.addEventListener('click', () => { const params = sdk?.toFilterParams?.({ search: 'Lagos', order: 'desc', values: { shipment_status: 'in-process' } }, sdk.trackShipmentsFilterConfig); const output = $('#sdk-filter-output'); if (output) output.textContent = JSON.stringify(params); });
  $('[data-sdk-filter-clear]')?.addEventListener('click', () => { const output = $('#sdk-filter-output'); if (output) output.textContent = JSON.stringify(sdk?.emptyFilterState?.() ?? {}); });
  $('[data-sdk-icons]')?.addEventListener('click', async () => { const output = $('#sdk-icon-output'); try { const spriteUrl = sdkModulePath.startsWith('../sdk/') ? '../sdk/icons.sprite.svg' : '/packages/icons/assets/icons.sprite.svg'; const registry = new sdk.IconRegistryService({ document, fetch, spriteUrl }); await registry.ensureLoaded(); if (output) output.textContent = `SDK sprite loaded · ${sdk.ICON_NAMES.length} names`; } catch (error) { if (output) output.textContent = `SDK sprite error · ${sdk.formatApiErrorMessage(error)}`; } });
}

function bindShell() {
  $('#theme-toggle')?.addEventListener('click', () => {
    state.theme = themeService?.toggle() ?? (state.theme === 'light' ? 'dark' : 'light');
    syncHeaderState();
  });
  $$('[data-mode]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.mode = button.getAttribute('data-mode') === 'stn' ? 'stn' : 'sfn';
      await shippingModeService?.setMode?.(state.mode);
      document.documentElement.dataset.shippingMode = state.mode;
      syncHeaderState();
      showToast('info', `${state.mode === 'sfn' ? 'Export' : 'Import'} mode enabled`);
    });
  });
  $('#mobile-navigation-toggle')?.addEventListener('click', () => state.mobileOpen ? closeMobile() : openMobile());
  $('#mobile-navigation-close')?.addEventListener('click', closeMobile);
  $('#mobile-navigation-backdrop')?.addEventListener('click', closeMobile);
  $('#side-nav-collapse')?.addEventListener('click', () => {
    state.navCollapsed = !state.navCollapsed;
    persistNavState();
    syncNavState();
  });
  $('#side-nav-collapse-all')?.addEventListener('click', () => {
    state.openParents.clear();
    persistNavState();
    syncNavState();
  });
  $$('[data-nav-parent]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-nav-parent');
      if (!id) return;
      if (state.navCollapsed) {
        state.navCollapsed = false;
        state.openParents.add(id);
        persistNavState();
        syncNavState();
        return;
      }
      toggleParent(id);
    });
  });
  $$('[data-nav-mobile-parent]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-nav-mobile-parent');
      if (id) toggleParent(id);
    });
  });
  $$('[data-nav-item]').forEach((item) => {
    const flyout = item.querySelector('[data-nav-flyout]');
    if (!flyout) return;
    item.addEventListener('mouseenter', () => {
      if (!state.navCollapsed) return;
      flyout.classList.remove('hidden');
      flyout.classList.add('block', 'pointer-events-auto');
    });
    item.addEventListener('mouseleave', () => {
      flyout.classList.add('hidden');
      flyout.classList.remove('block', 'pointer-events-auto');
    });
  });
  $('#access-token')?.addEventListener('click', () => state.accessTokenOpen ? closeAccessTokenPanel() : openAccessTokenPanel());
  $('#access-token-panel-close')?.addEventListener('click', closeAccessTokenPanel);
  $('#access-token-save')?.addEventListener('click', () => {
    const value = $('#access-token-input')?.value?.trim() ?? '';
    authTokenService?.set?.(value);
    closeAccessTokenPanel();
    syncHeaderState();
    showToast('success', 'Connected');
  });
  $('#access-token-clear')?.addEventListener('click', () => {
    authTokenService?.clear?.();
    closeAccessTokenPanel();
    syncHeaderState();
    showToast('info', 'Token cleared');
  });
  $('#notifications')?.addEventListener('click', () => { notificationDrawerService?.open(); });
  $('#account-menu')?.addEventListener('click', () => state.accountMenuOpen ? closeAccountMenu() : openAccountMenu());
  $$('[data-account-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.getAttribute('data-account-action');
      closeAccountMenu();
      if (action === 'logout') {
        const result = await confirmService?.confirm({ title: 'Log out?', message: 'This signs you out of this device and every other session.', confirmLabel: 'Log out', danger: true });
        if (result) {
          authTokenService?.clear?.();
          syncHeaderState();
          showToast('success', 'You have been logged out.');
        }
        return;
      }
      showToast('info', action === 'profile' ? 'Profile coming soon' : 'Settings coming soon');
    });
  });
  document.addEventListener('click', (event) => {
    const pathList = event.composedPath();
    const navLink = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (navLink) requestAnimationFrame(renderRoute);
    if (!pathList.includes($('#access-token')) && !pathList.includes($('#access-token-panel')) && state.accessTokenOpen) closeAccessTokenPanel();
    if (!pathList.includes($('#account-menu')) && !pathList.includes($('#account-menu-panel')) && state.accountMenuOpen) closeAccountMenu();
    if (event.target.matches?.('[data-overlay-close],[data-overlay-backdrop]')) closeOverlay();
    if (event.target.matches?.('[data-overlay-action]')) { closeOverlay(); showToast('success', 'Action completed'); }
  });
  document.addEventListener('keydown', (event) => {
    const navLink = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (navLink && (event.key === 'Enter' || event.key === ' ')) requestAnimationFrame(renderRoute);
    if (event.key === 'Escape') {
      closeOverlay();
      closeMobile();
      closeAccessTokenPanel();
      closeAccountMenu();
      const menu = $('[data-action-menu][aria-expanded="true"]');
      if (menu) {
        menu.nextElementSibling.hidden = true;
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    }
    if (event.key === 'Tab') {
      const dialog = $('[role="dialog"]');
      if (dialog) {
        const focus = [...dialog.querySelectorAll('button,input,textarea,[href]')];
        if (!focus.length) return;
        const first = focus[0];
        const last = focus.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  });
}

function headerWeatherLabel(kind) {
  return ({ clear: 'Clear', cloudy: 'Cloudy', fog: 'Fog', drizzle: 'Drizzle', rain: 'Rain', snow: 'Snow', storm: 'Storm' })[kind] ?? 'Cloudy';
}
function headerWeatherIcon(kind, hour) {
  if (kind === 'clear') return hour >= 19 || hour < 6 ? 'moon-o' : 'sun-o';
  if (kind === 'rain' || kind === 'drizzle' || kind === 'storm') return 'cloud';
  return 'cloud-o';
}
function mapWmoWeatherCode(code) {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'storm';
  return null;
}
async function loadHeaderWeather(fetchFn = fetch) {
  if (typeof fetchFn !== 'function') return null;
  try {
    const browser = await new Promise((resolve) => {
      if (typeof navigator === 'undefined' || typeof navigator.geolocation?.getCurrentPosition !== 'function') return resolve(null);
      const timer = setTimeout(() => resolve(null), 3500);
      navigator.geolocation.getCurrentPosition((position) => {
        clearTimeout(timer);
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      }, () => {
        clearTimeout(timer);
        resolve(null);
      }, { enableHighAccuracy: false, maximumAge: 600000, timeout: 3500 });
    });
    const geo = browser ?? await fetchJson('https://get.geojs.io/v1/ip/geo.json', fetchFn);
    const latitude = Number(geo?.latitude);
    const longitude = Number(geo?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const forecast = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,temperature_2m`, fetchFn);
    const kind = mapWmoWeatherCode(Number(forecast?.current?.weather_code));
    if (!kind) return null;
    const reverse = await fetchJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(latitude))}&longitude=${encodeURIComponent(String(longitude))}&localityLanguage=en`, fetchFn);
    return {
      kind,
      temperatureC: Number(forecast?.current?.temperature_2m),
      city: reverse?.city ?? reverse?.locality ?? reverse?.principalSubdivision ?? geo?.city ?? undefined
    };
  } catch {
    return null;
  }
}
async function fetchJson(url, fetchFn) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetchFn(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

bindShell();
document.documentElement.dataset.shippingMode = state.mode;
syncNavState();
syncHeaderState();
renderRoute();
state.clockTimer = setInterval(syncClock, 1000);
loadHeaderWeather().then((weather) => { state.weather = weather; syncHeaderState(); });
addEventListener('hashchange', renderRoute);
