import { matchRoute } from './routes.mjs';
import { DISABLED_ROUTES, NAV_ITEMS, renderShell, resolveShellMeta, updateActiveLinks, updateBreadcrumbs } from './shell.mjs';
import { applyUtilities, utilities } from './styles.mjs';

const sdkModulePath = '../../../packages/sdk/dist/africanies-web-sdk.esm.js';
let sdk;
try {
  sdk = await import(sdkModulePath);
  sdk.defineAfricaniesElements({ iconSpriteUrl: '/packages/icons/assets/icons.sprite.svg' });
  document.documentElement.dataset.sdk = 'registered';
} catch {
  document.documentElement.dataset.sdk = 'unavailable';
}

const app = document.querySelector('#app');
if (!app) throw new Error('Missing #app root');
app.innerHTML = renderShell();
document.documentElement.style.height = '100%';
document.body.style.height = '100%';
document.body.style.overflow = 'hidden';

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
const filterResolver = {
  resolve: async (config) => Object.fromEntries((config?.fields ?? [])
    .filter((field) => Array.isArray(field.options))
    .map((field) => [field.key, field.options]))
};
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
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
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
  $('#content-scroll-region')?.scrollTo({ top: 0, behavior: 'auto' });
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
  initializeRouteDemos();
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
  document.querySelectorAll('[data-demo-submit]').forEach((element) => { element.onclick = (event) => { event.preventDefault(); const form = element.closest('form'); const output = $('[data-form-output]', form ?? document); if (!form?.reportValidity()) { if (output) output.textContent = 'Validation blocked submission.'; return; } if (output) output.textContent = JSON.stringify(Object.fromEntries(new FormData(form)), null, 2); showToast('success', 'Details saved'); }; });
  document.querySelectorAll('[data-demo-reset]').forEach((element) => { element.onclick = (event) => { event.preventDefault(); const form = element.closest('form'); form?.reset(); const output = $('[data-form-output]', form ?? document); if (output) output.textContent = ''; }; });
  document.querySelectorAll('.copy-code').forEach((element) => { element.onclick = async () => { try { await navigator.clipboard.writeText(element.dataset.copy); showToast('success', 'Code copied'); } catch { showToast('danger', 'Copy failed'); } }; });
  const iconSearch = $('[data-icon-search]');
  if (iconSearch) iconSearch.oninput = () => document.querySelectorAll('[data-icon-name]').forEach((element) => { element.hidden = !element.dataset.iconName.includes(iconSearch.value.toLowerCase()); });
  document.querySelectorAll('.tooltip-trigger').forEach((trigger) => {
    const tooltip = document.getElementById(trigger.getAttribute('aria-describedby') ?? '');
    if (!tooltip) return;
    const open = () => { tooltip.hidden = false; };
    const close = () => { tooltip.hidden = true; };
    trigger.addEventListener('mouseenter', open);
    trigger.addEventListener('mouseleave', close);
    trigger.addEventListener('focus', open);
    trigger.addEventListener('blur', close);
  });
  document.querySelectorAll('[data-table-sort]').forEach((control) => {
    control.addEventListener('click', () => {
      const type = control.closest('[data-playground-filter-table="usecase"]') ? 'usecase' : 'component';
      const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
      const key = control.dataset.tableSort;
      if (!key) return;
      tableState.sortDirection = tableState.sortKey === key && tableState.sortDirection === 'asc' ? 'desc' : 'asc';
      tableState.sortKey = key;
      renderPlaygroundTable(type);
    });
  });
  document.querySelectorAll('[data-table-demo]').forEach((control) => {
    control.addEventListener('click', () => {
      playgroundState.componentTable.demo = control.dataset.tableDemo;
      renderPlaygroundTable('component');
    });
  });
  document.querySelectorAll('[data-table-apply]').forEach((control) => {
    control.addEventListener('click', () => {
      const type = control.closest('[data-playground-filter-table="usecase"]') ? 'usecase' : 'component';
      const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
      const next = { ...tableState.filterState, search: $('[data-table-search]', control.closest('[data-playground-filter-table]'))?.value?.trim() || undefined };
      commitTableFilters(type, next);
    });
  });
  document.querySelectorAll('[data-table-clear]').forEach((control) => {
    control.addEventListener('click', () => {
      const type = control.closest('[data-playground-filter-table="usecase"]') ? 'usecase' : 'component';
      commitTableFilters(type, emptyFilters());
      showToast('info', 'Filters cleared');
    });
  });
  document.querySelectorAll('[data-table-filter]').forEach((control) => { control.addEventListener('click', () => { void openFilterDrawerFor(control.closest('[data-playground-filter-table="usecase"]') ? 'usecase' : 'component', control); }); });
  document.querySelectorAll('[data-page-direction]').forEach((control) => {
    control.addEventListener('click', () => {
      const type = control.closest('[data-playground-filter-table="usecase"]') ? 'usecase' : 'component';
      const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
      tableState.page += control.dataset.pageDirection === 'next' ? 1 : -1;
      tableState.filterState = { ...tableState.filterState, page: tableState.page, size: tableState.size };
      filterQueryService?.setPage?.(tableState.page, TRACK_SHIPMENTS_CONFIG);
      renderPlaygroundTable(type);
    });
  });
  document.querySelectorAll('[data-table-refresh]').forEach((control) => { control.addEventListener('click', () => { playgroundState.componentTable.demo = 'loading'; renderPlaygroundTable('component'); setTimeout(() => { playgroundState.componentTable.demo = 'ready'; renderPlaygroundTable('component'); }, 500); }); });
  document.querySelectorAll('[data-table-export]').forEach((control) => { control.addEventListener('click', () => showToast('success', `Export ready · ${sdk?.toCsvString?.({ headers: ['reference'], rows: [['SFN-1000']] })?.length ?? 0} bytes`)); });
  document.querySelectorAll('[data-filter-chip-remove]').forEach((control) => {
    control.addEventListener('click', () => {
      const type = control.closest('[data-playground-filter-table="usecase"]') ? 'usecase' : 'component';
      const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
      const key = control.dataset.filterChipRemove;
      const next = { ...tableState.filterState, values: { ...tableState.filterState.values } };
      if (key === 'search') next.search = undefined;
      else if (key === 'date') { next.from = undefined; next.to = undefined; next.date = undefined; }
      else delete next.values[key];
      commitTableFilters(type, next);
    });
  });
  document.querySelectorAll('[data-row-menu-button]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-row-menu]').forEach((menuPanel) => { if (menuPanel !== button.nextElementSibling) menuPanel.classList.add('hidden'); });
      const panel = button.nextElementSibling;
      const open = panel.classList.toggle('hidden') === false;
      button.setAttribute('aria-expanded', String(open));
      if (open) panel.querySelector('[role="menuitem"]')?.focus();
    });
  });
  document.querySelectorAll('[data-row-action="copy"]').forEach((button) => { button.addEventListener('click', async () => { await navigator.clipboard.writeText(button.dataset.reference ?? ''); showToast('success', 'Reference copied'); button.closest('[data-row-menu]')?.classList.add('hidden'); }); });
  document.querySelectorAll('[data-row-action="delete"]').forEach((button) => { button.addEventListener('click', () => { showToast('warning', `Delete ${button.dataset.reference}`); button.closest('[data-row-menu]')?.classList.add('hidden'); }); });
  document.querySelectorAll('[data-step-index]').forEach((button) => button.addEventListener('click', () => { playgroundState.stepperIndex = Number(button.dataset.stepIndex ?? 0); renderStepper(); }));
  $('[data-stepper-back]')?.addEventListener('click', () => { playgroundState.stepperIndex = Math.max(0, playgroundState.stepperIndex - 1); renderStepper(); });
  $('[data-stepper-next]')?.addEventListener('click', () => { playgroundState.stepperIndex = Math.min(3, playgroundState.stepperIndex + 1); renderStepper(); });
  document.querySelectorAll('[data-onboarding-submit]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const form = button.closest('form');
      const output = $('[data-onboarding-output]', form?.parentElement ?? document);
      const values = Object.fromEntries([...form.querySelectorAll('africanies-text-input')].map((field) => [field.getAttribute('name'), readFieldValue(field).trim()]));
      if (!values.email || !sdk?.isValidEmail?.(values.email)) { if (output) output.textContent = 'Enter a valid email address.'; return; }
      if (form.dataset.onboardingForm === 'reset' && values.password !== values.confirmation) { if (output) output.textContent = 'Passwords do not match.'; return; }
      if ((form.dataset.onboardingForm === 'login' || form.dataset.onboardingForm === 'reset') && !values.password) { if (output) output.textContent = 'Password is required.'; return; }
      if (output) output.textContent = form.dataset.onboardingForm === 'forgot' ? 'Reset link sent.' : form.dataset.onboardingForm === 'reset' ? 'Password updated.' : 'Signed in (demo).';
      showToast('success', 'Form submitted');
    });
  });
  document.querySelectorAll('[data-onboarding-clear]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault();
    const form = button.closest('form');
    form.querySelectorAll('africanies-text-input').forEach((field) => { field.value = ''; field.setAttribute('value', ''); });
    const output = $('[data-onboarding-output]', form?.parentElement ?? document);
    if (output) output.textContent = '';
  }));
  document.querySelectorAll('[data-sdk-overlay]').forEach((control) => { control.onclick = async () => { const kind = control.dataset.sdkOverlay; if (kind === 'confirm') { const result = await confirmService?.confirm({ title: 'Cancel shipment?', message: 'This action cannot be undone.', danger: true }); showToast('info', `SDK confirm result: ${String(result)}`); return; } const service = kind === 'drawer' ? drawerService : modalService; service?.open(({ document: owner, ref }) => { const frame = owner.createElement('africanies-overlay-frame'); frame.innerHTML = '<strong slot="header">SDK overlay</strong><p>Opened by the SDK overlay service.</p><button slot="footer" type="button">Close</button>'; frame.querySelector('button')?.addEventListener('click', () => ref.close('closed')); return frame; }, { dismissible: true }); }; });
  document.querySelectorAll('[data-sdk-toast]').forEach((control) => { control.onclick = () => { const kind = control.dataset.sdkToast; if (kind === 'stack') { toastService?.success('Duplicate notification', 'SDK toast'); toastService?.success('Duplicate notification', 'SDK toast'); } else if (kind === 'error') toastService?.error('Persistent SDK error', 'Action failed'); else toastService?.success('Shipment saved', 'SDK toast'); }; });
  $('[data-sdk-with-toast]')?.addEventListener('click', () => { const output = $('#sdk-with-toast-output'); if (output) output.textContent = JSON.stringify(sdk.withToast({ successMessage: 'Shipment saved', errorMessage: 'Shipment failed' })); });
  $('[data-sdk-filter-drawer]')?.addEventListener('click', () => { const ref = filterDrawerService?.open(TRACK_SHIPMENTS_CONFIG); void ref?.closed.then((result) => { const output = $('#sdk-filter-output'); if (output) output.textContent = JSON.stringify(result ?? {}); }); });
  $('[data-sdk-notifications]')?.addEventListener('click', () => { notificationDrawerService?.open(); });
  const runRetryConfirmDemo = (outputSelector) => {
    let attempts = 0;
    const output = $(outputSelector);
    const onError = () => { if (output) output.textContent = 'Async error surfaced · retry available'; };
    document.addEventListener('confirm-error', onError, { once: true });
    void confirmService?.confirm({ title: 'Retryable confirmation', message: 'The first attempt fails; retry succeeds.', confirmLabel: 'Run async work', onConfirm: async () => { attempts += 1; await Promise.resolve(); if (attempts === 1) throw new Error('Simulated transient failure'); } }).then((result) => { if (output) output.textContent = `Confirmed after retry: ${result}`; });
  };
  $('[data-sdk-confirm-retry]')?.addEventListener('click', () => { runRetryConfirmDemo('#sdk-confirm-output'); });
  $('[data-confirm-retry-demo]')?.addEventListener('click', () => { runRetryConfirmDemo('[data-confirm-output]'); });
  $('[data-sdk-form-submit]')?.addEventListener('click', (event) => { event.preventDefault(); const form = event.currentTarget.closest('form'); const output = $('#sdk-form-output'); if (output) output.textContent = JSON.stringify(Object.fromEntries([...form.querySelectorAll('[name]')].map((field) => [field.getAttribute('name'), readFieldValue(field)])), null, 2); });
  $('[data-sdk-filter-apply]')?.addEventListener('click', () => {
    const params = sdk?.toFilterParams?.({ search: 'Lagos', order: 'desc', values: { shipment_status: 'in-process' } }, TRACK_SHIPMENTS_CONFIG)
      ?? { search: 'Lagos', order: 'desc', shipment_status: 'in-process' };
    const output = $('#sdk-filter-output');
    if (output) output.textContent = JSON.stringify(params);
  });
  $('[data-sdk-filter-clear]')?.addEventListener('click', () => { const output = $('#sdk-filter-output'); if (output) output.textContent = JSON.stringify(sdk?.emptyFilterState?.() ?? {}); });
  $('[data-sdk-icons]')?.addEventListener('click', async () => { const output = $('#sdk-icon-output'); try { const spriteUrl = sdkModulePath.startsWith('../sdk/') ? '../sdk/icons.sprite.svg' : '/packages/icons/assets/icons.sprite.svg'; const registry = new sdk.IconRegistryService({ document, fetch, spriteUrl }); await registry.ensureLoaded(); if (output) output.textContent = `SDK sprite loaded · ${sdk.ICON_NAMES.length} names`; } catch (error) { if (output) output.textContent = `SDK sprite error · ${sdk.formatApiErrorMessage(error)}`; } });
}

const TRACK_SHIPMENTS_CONFIG = sdk?.trackShipmentsFilterConfig ?? {
  id: 'track-shipments',
  search: { param: 'search', label: 'Shipment ID', placeholder: 'Search' },
  date: { rangeParams: { from: 'from', to: 'to' }, fieldParam: 'date', fields: [{ value: 'created_at', label: 'Date Created' }] },
  sort: { param: 'order', options: [{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }] },
  pagination: { pageParam: 'page', sizeParam: 'size' },
  fields: [
    { key: 'payment_status', label: 'Payment Status', type: 'enum', options: [{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }] },
    { key: 'shipment_status', label: 'Shipment Status', type: 'enum', options: [{ value: 'pending', label: 'Pending' }, { value: 'in-process', label: 'In Process' }, { value: 'completed', label: 'Completed' }] },
    { key: 'tracking_number', label: 'Tracking Number', type: 'text', placeholder: 'Search' }
  ]
};
const DEFAULT_PAGE_SIZE = 15;
const demoRows = Array.from({ length: 28 }, (_, index) => {
  const statuses = [
    ['In transit', 'in-process', 'paid'],
    ['Delivered', 'completed', 'paid'],
    ['Pending', 'pending', 'unpaid'],
    ['Exception', 'pending', 'unpaid']
  ];
  const cities = ['Lagos', 'Accra', 'Nairobi', 'Cairo', 'London'];
  const [status, shipmentStatus, paymentStatus] = statuses[index % statuses.length];
  const origin = cities[index % 4];
  const destination = cities[(index + 1) % cities.length];
  return {
    reference: `${index % 2 === 0 ? 'SFN' : 'STN'}-${1000 + index}`,
    route: `${origin} → ${destination}`,
    trackingNumber: `TN-${8000 + index}`,
    status,
    shipmentStatus,
    paymentStatus,
    updated: `${index + 1} hour${index === 0 ? '' : 's'} ago`
  };
});
const usecaseRows = [
  { reference: 'STN-1042', route: 'Lagos → London', trackingNumber: 'TN-8000', status: 'In transit', shipmentStatus: 'in-process', paymentStatus: 'paid', updated: '2 hours ago' },
  { reference: 'SFN-8811', route: 'Accra → Manchester', trackingNumber: 'TN-8001', status: 'Pending', shipmentStatus: 'pending', paymentStatus: 'unpaid', updated: 'Yesterday' },
  { reference: 'STN-2207', route: 'Nairobi → Dubai', trackingNumber: 'TN-8002', status: 'Delivered', shipmentStatus: 'completed', paymentStatus: 'paid', updated: '3 days ago' },
  { reference: 'SFN-4410', route: 'Cairo → Berlin', trackingNumber: 'TN-8003', status: 'Exception', shipmentStatus: 'pending', paymentStatus: 'unpaid', updated: '5 hours ago' },
  ...demoRows.slice(4, 24)
];
const emptyFilters = () => sdk?.emptyFilterState?.() ?? { values: {}, order: 'desc' };
const playgroundState = {
  componentTable: { page: 1, size: DEFAULT_PAGE_SIZE, sortKey: 'reference', sortDirection: 'asc', demo: 'ready', draftSearch: '', filterState: emptyFilters() },
  usecaseTable: { page: 1, size: DEFAULT_PAGE_SIZE, sortKey: 'reference', sortDirection: 'asc', demo: 'ready', draftSearch: '', filterState: emptyFilters() },
  stepperIndex: 1
};

function hydrateTableState(type) {
  const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
  const next = filterQueryService?.read?.(TRACK_SHIPMENTS_CONFIG);
  if (next && typeof next === 'object' && 'values' in next) {
    tableState.filterState = next;
    tableState.page = next.page ?? 1;
    tableState.size = next.size ?? DEFAULT_PAGE_SIZE;
    tableState.draftSearch = next.search ?? '';
  }
  return tableState;
}

function activeFilterCount(filterState) {
  const params = sdk?.toFilterParams?.(filterState, TRACK_SHIPMENTS_CONFIG) ?? {};
  return Object.keys(params).filter((key) => !['page', 'size', 'per_page', 'order'].includes(key)).length;
}

function filterRows(rows, tableState) {
  const filterState = tableState.filterState ?? emptyFilters();
  const search = (filterState.search ?? '').trim().toLowerCase();
  const shipmentStatus = filterState.values?.shipment_status ?? '';
  const paymentStatus = filterState.values?.payment_status ?? '';
  const tracking = (filterState.values?.tracking_number ?? '').trim().toLowerCase();
  return rows
    .filter((row) => (!search || row.reference.toLowerCase().includes(search) || row.trackingNumber.toLowerCase().includes(search))
      && (!shipmentStatus || row.shipmentStatus === shipmentStatus)
      && (!paymentStatus || row.paymentStatus === paymentStatus)
      && (!tracking || row.trackingNumber.toLowerCase().includes(tracking)))
    .sort((a, b) => String(a[tableState.sortKey] ?? '').localeCompare(String(b[tableState.sortKey] ?? '')) * (tableState.sortDirection === 'desc' ? -1 : 1));
}

function filterChipsMarkup(filterState) {
  const chips = [];
  if (filterState.search) chips.push(['search', `Search: ${filterState.search}`]);
  if (filterState.values?.payment_status) chips.push(['payment_status', `Payment: ${filterState.values.payment_status}`]);
  if (filterState.values?.shipment_status) chips.push(['shipment_status', `Shipment: ${filterState.values.shipment_status}`]);
  if (filterState.values?.tracking_number) chips.push(['tracking_number', `Tracking: ${filterState.values.tracking_number}`]);
  if (filterState.from || filterState.to) chips.push(['date', `${filterState.date === 'created_at' ? 'Date created' : 'Date'}: ${filterState.from ?? '…'} → ${filterState.to ?? '…'}`]);
  return chips.length ? `<div class="mt-3 flex flex-wrap gap-2">${chips.map(([key, label]) => `<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">${esc(label)}<button type="button" class="inline-flex size-5 items-center justify-center rounded-full" data-filter-chip-remove="${key}" aria-label="Remove ${esc(label)}">${renderIcon('close', 12)}</button></span>`).join('')}</div>` : '';
}

function rowMenuMarkup(row, type) {
  const detail = `<a href="#/usecases/shipment/${encodeURIComponent(row.reference)}" role="menuitem" class="block rounded-md px-3 py-2 text-sm text-ink hover:bg-slate-100 dark:text-white dark:hover:bg-white/10">View details</a>`;
  const extras = type === 'usecase' ? '' : `<button type="button" role="menuitem" class="block w-full rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-slate-100 dark:text-white dark:hover:bg-white/10" data-row-action="copy" data-reference="${row.reference}">Copy reference</button><button type="button" role="menuitem" class="block w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-red-50 dark:hover:bg-red-950/30" data-row-action="delete" data-reference="${row.reference}">Delete</button>`;
  return `<div class="relative"><button type="button" class="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-white text-ink dark:border-white/15 dark:bg-ink dark:text-white" data-row-menu-button="${row.reference}" aria-haspopup="menu" aria-expanded="false" aria-label="Actions for ${row.reference}">${renderIcon('ellipsis-v', 16)}</button><div class="absolute right-0 top-11 z-20 hidden min-w-[11rem] rounded-xl border border-border bg-white p-1 shadow-xl dark:border-white/15 dark:bg-ink" role="menu" data-row-menu="${row.reference}">${detail}${extras}</div></div>`;
}

function renderPlaygroundTable(type) {
  const container = $(`[data-playground-filter-table="${type}"]`);
  if (!container) return;
  const tableState = hydrateTableState(type);
  const rows = filterRows(type === 'usecase' ? usecaseRows : demoRows, tableState);
  const totalPages = Math.max(1, Math.ceil(rows.length / tableState.size));
  tableState.page = Math.min(tableState.page, totalPages);
  const pageRows = rows.slice((tableState.page - 1) * tableState.size, tableState.page * tableState.size);
  const filterCount = activeFilterCount(tableState.filterState);
  const stateButtons = type === 'component' ? `<div class="mb-4 flex flex-wrap gap-2">${['ready', 'loading', 'empty', 'error'].map((kind) => `<button type="button" class="rounded-lg border px-3 py-2 text-sm font-semibold ${tableState.demo === kind ? 'border-export bg-export text-white' : 'border-border bg-white text-ink dark:border-white/15 dark:bg-ink dark:text-white'}" data-table-demo="${kind}">${kind}</button>`).join('')}</div>` : '';
  const currentRows = tableState.demo === 'empty' ? [] : pageRows;
  const tableMarkup = tableState.demo === 'loading'
    ? `<div class="flex min-h-[14rem] items-center justify-center rounded-xl border border-dashed border-border bg-background-welcome dark:border-white/10 dark:bg-ink-950"><div class="flex flex-col items-center gap-2 text-sm text-neutral-500"><span class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-export border-r-transparent"></span><strong>Loading shipments…</strong></div></div>`
    : tableState.demo === 'error'
      ? `<div class="rounded-xl border border-danger/25 bg-danger-subtle p-5 text-sm text-danger">Could not load shipments. Try refresh or adjust your filters.</div>`
      : currentRows.length === 0
        ? `<div class="rounded-xl border border-dashed border-border bg-background-welcome p-6 text-center dark:border-white/10 dark:bg-ink-950"><strong class="block">No shipments match these filters.</strong><span class="mt-1 block text-sm text-neutral-500">Clear a chip or reset the drawer to restore rows.</span></div>`
        : `<div class="table-wrap overflow-auto rounded-xl border border-border dark:border-white/10"><table class="min-w-[760px] w-full border-collapse"><thead><tr>${[
            ['reference', 'Reference'],
            ['status', 'Status'],
            [type === 'usecase' ? 'route' : 'trackingNumber', type === 'usecase' ? 'Route' : 'Tracking'],
            ['updated', 'Updated'],
            ['actions', '']
          ].map(([key, label]) => `<th class="sticky top-0 z-10 border-b border-border bg-white px-3.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-neutral-500 dark:border-white/10 dark:bg-ink">${key !== 'actions' ? `<button type="button" class="border-0 bg-transparent p-0 text-left text-inherit" data-table-sort="${key}">${label}${tableState.sortKey === key ? tableState.sortDirection === 'asc' ? ' ↑' : ' ↓' : ''}</button>` : label}</th>`).join('')}</tr></thead><tbody>${currentRows.map((row) => `<tr><td class="border-b border-border px-3.5 py-3 font-medium dark:border-white/10">${type === 'usecase' ? `<a href="#/usecases/shipment/${encodeURIComponent(row.reference)}" class="text-ink no-underline hover:underline dark:text-white">${row.reference}</a>` : row.reference}</td><td class="border-b border-border px-3.5 py-3 dark:border-white/10"><span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">${row.status}</span></td><td class="border-b border-border px-3.5 py-3 dark:border-white/10">${type === 'usecase' ? row.route : row.trackingNumber}</td><td class="border-b border-border px-3.5 py-3 dark:border-white/10">${row.updated}</td><td class="border-b border-border px-3.5 py-3 dark:border-white/10">${rowMenuMarkup(row, type)}</td></tr>`).join('')}</tbody></table></div>`;
  container.innerHTML = `${stateButtons}<div class="filter-bar flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center"><label class="search flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white pl-2.5 dark:border-slate-600 dark:bg-slate-900">${renderIcon('search', 16)}<input class="w-full border-0 bg-transparent px-2.5 py-2 outline-none" placeholder="Search shipments" value="${esc(tableState.draftSearch)}" data-table-search></label><button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 font-semibold text-ink dark:border-white/15 dark:bg-ink dark:text-white" data-table-filter>${renderIcon('filter', 16)}Filters${filterCount ? `<span class="inline-flex min-w-6 items-center justify-center rounded-full bg-export px-1.5 py-0.5 text-xs font-bold text-white">${filterCount}</span>` : ''}</button><button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg bg-export px-4 py-2 font-semibold text-white" data-table-apply>Apply</button><button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-semibold text-ink underline-offset-2 hover:underline dark:text-white" data-table-clear>Clear all</button>${type === 'component' ? `<button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 font-semibold text-ink dark:border-white/15 dark:bg-ink dark:text-white" data-table-refresh>Refresh</button><button type="button" class="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-2 font-bold text-ink dark:border-white/15 dark:bg-ink dark:text-white" data-table-export>Export CSV</button>` : ''}</div>${filterChipsMarkup(tableState.filterState)}<div class="mt-4 flex items-center justify-between gap-3 text-sm text-neutral-500"><span>${rows.length} shipment${rows.length === 1 ? '' : 's'}</span><span>Page ${tableState.page} of ${totalPages}</span></div><div class="mt-4">${tableMarkup}</div><nav class="pagination mt-4 flex items-center justify-end gap-3.5" aria-label="Pagination"><button type="button" class="rounded-lg border border-border bg-white px-3 py-2 font-semibold text-ink disabled:opacity-50 dark:border-white/15 dark:bg-ink dark:text-white" data-page-direction="prev" ${tableState.page <= 1 || !rows.length ? 'disabled' : ''}>Previous</button><button type="button" class="rounded-lg border border-border bg-white px-3 py-2 font-semibold text-ink disabled:opacity-50 dark:border-white/15 dark:bg-ink dark:text-white" data-page-direction="next" ${tableState.page >= totalPages || !rows.length ? 'disabled' : ''}>Next</button></nav>`;
}

function commitTableFilters(type, nextFilterState) {
  const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
  tableState.filterState = { ...nextFilterState, page: 1, size: tableState.size };
  tableState.page = 1;
  tableState.draftSearch = tableState.filterState.search ?? '';
  filterQueryService?.write?.(tableState.filterState, TRACK_SHIPMENTS_CONFIG);
  renderPlaygroundTable(type);
}

async function openFilterDrawerFor(type, trigger = document.activeElement) {
  const tableState = type === 'usecase' ? playgroundState.usecaseTable : playgroundState.componentTable;
  const ref = filterDrawerService?.open?.({ config: TRACK_SHIPMENTS_CONFIG, state: { ...tableState.filterState, page: tableState.page, size: tableState.size }, title: 'Filter shipments' });
  const result = await ref?.closed;
  if (result?.applied) commitTableFilters(type, result.state);
  trigger?.focus?.();
}

function renderStepper() {
  const panel = $('[data-stepper-panel]');
  const back = $('[data-stepper-back]');
  const next = $('[data-stepper-next]');
  const steps = $$('[data-step-index]');
  if (!panel || !steps.length) return;
  const bodies = [
    '<strong class="block text-lg">Addresses</strong><p class="mt-2 text-sm text-neutral-500">Pickup and delivery route for this shipment.</p>',
    '<strong class="block text-lg">Package</strong><p class="mt-2 text-sm text-neutral-500">Set weight, dimensions and commodity details.</p>',
    '<strong class="block text-lg">Service</strong><p class="mt-2 text-sm text-neutral-500">Choose economy, standard or express service.</p>',
    '<strong class="block text-lg">Review</strong><p class="mt-2 text-sm text-neutral-500">Confirm the completed shipment before submit.</p>'
  ];
  panel.className = 'rounded-xl border border-border bg-white p-5 dark:border-white/10 dark:bg-ink';
  panel.innerHTML = bodies[playgroundState.stepperIndex] ?? bodies[0];
  steps.forEach((button, index) => {
    const parent = button.closest('li');
    parent?.classList.remove('complete', 'active');
    if (index < playgroundState.stepperIndex) parent?.classList.add('complete');
    else if (index === playgroundState.stepperIndex) parent?.classList.add('active');
  });
  if (back) back.disabled = playgroundState.stepperIndex === 0;
  if (next) next.disabled = playgroundState.stepperIndex === steps.length - 1;
}

function readFieldValue(element) {
  return element?.value ?? element?.getAttribute?.('value') ?? '';
}

function initializeRouteDemos() {
  if ($('[data-playground-filter-table="component"]')) renderPlaygroundTable('component');
  if ($('[data-playground-filter-table="usecase"]')) renderPlaygroundTable('usecase');
  if ($('[data-stepper-demo]')) renderStepper();
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
    if (!(event.target instanceof Element && event.target.closest('[data-row-menu-button],[data-row-menu]'))) {
      document.querySelectorAll('[data-row-menu]').forEach((panel) => panel.classList.add('hidden'));
      document.querySelectorAll('[data-row-menu-button]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }
    if (event.target.matches?.('[data-overlay-close],[data-overlay-backdrop]')) closeOverlay();
    if (event.target.matches?.('[data-overlay-action]')) { closeOverlay(); showToast('success', 'Action completed'); }
  });
  document.addEventListener('keydown', (event) => {
    const navLink = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (navLink && (event.key === 'Enter' || event.key === ' ')) requestAnimationFrame(renderRoute);
    const rowMenu = event.target instanceof Element ? event.target.closest('[data-row-menu]') : null;
    if (rowMenu && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      const items = [...rowMenu.querySelectorAll('[role="menuitem"]')];
      const current = items.indexOf(document.activeElement);
      const next = (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      event.preventDefault();
      items[next]?.focus();
    }
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
      document.querySelectorAll('[data-row-menu]').forEach((panel) => panel.classList.add('hidden'));
      document.querySelectorAll('[data-row-menu-button]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
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
