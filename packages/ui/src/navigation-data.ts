import { withAfricaniesShadowStyles } from './styles.js';

type HTMLElementConstructor = typeof HTMLElement;
const HTMLElementBase: HTMLElementConstructor = (globalThis.HTMLElement ?? class {}) as HTMLElementConstructor;
const esc = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface RouteTarget { href: string; label: string; }
export interface AfricaniesNavItem { id?: string; label: string; href?: string; routerLink?: string | readonly unknown[]; disabled?: boolean; icon?: string; queryParams?: Record<string, unknown>; fragment?: string; children?: readonly AfricaniesSideNavItem[]; }
export type AfricaniesSideNavItem = AfricaniesNavItem;
export interface HeaderBackTarget { routerLink: string | readonly unknown[]; queryParams?: Record<string, unknown>; fragment?: string; }
export type ContentBackTarget = HeaderBackTarget;
export const normalizeNavPath = (url: string): string => { const path = url.split('?')[0]?.split('#')[0] || '/'; return path === '/' ? '/' : path.replace(/\/+$/, ''); };
const navHref = (item: AfricaniesNavItem): string => typeof item.routerLink === 'string' ? item.routerLink : item.href ?? '';
export const isNavItemActive = (item: AfricaniesNavItem, url: string, exact = false): boolean => { const href = normalizeNavPath(navHref(item)); const path = normalizeNavPath(url); return Boolean(href) && (exact ? path === href : path === href || path.startsWith(`${href}/`)); };
export const navItemUrlTree = (item: AfricaniesNavItem): string | readonly unknown[] | null => item.routerLink ?? item.href ?? null;
export const isNestedChildRoute = (url: string, items: readonly AfricaniesSideNavItem[]): boolean => items.some(item => { const href = normalizeNavPath(navHref(item)); const path = normalizeNavPath(url); return Boolean(href) && path !== href && path.startsWith(`${href.replace(/\/overview$/, '')}/`); });
export const isCatalogRootRoute = (url: string, items: readonly AfricaniesSideNavItem[]): boolean => items.some(item => normalizeNavPath(navHref(item)) === normalizeNavPath(url));
export function resolveCatalogRootLink(url: string, items: readonly AfricaniesSideNavItem[]): string | null { const path = normalizeNavPath(url); return items.map(navHref).filter(Boolean).sort((a, b) => b.length - a.length).find(href => path === normalizeNavPath(href) || path.startsWith(`${normalizeNavPath(href).replace(/\/overview$/, '')}/`)) ?? null; }
export function resolveHeaderBackTarget(breadcrumbs: readonly AfricaniesNavItem[], backLink?: string | readonly unknown[] | null): HeaderBackTarget | null {
  if (backLink != null) return { routerLink: backLink };
  for (let index = breadcrumbs.length - 2; index >= 0; index--) {
    const item = breadcrumbs[index];
    if (!item || item.disabled) continue;
    const target = navItemUrlTree(item);
    if (target != null) return { routerLink: target, queryParams: item.queryParams, fragment: item.fragment };
  }
  return null;
}
export function resolveContentBackTarget(parentPath: string | null, currentUrl: string, catalogRootLink?: string | null, backLink?: string | readonly unknown[] | null): ContentBackTarget | null { if (backLink != null) return { routerLink: backLink }; if (!parentPath) return null; const parent = normalizeNavPath(parentPath); const catalog = catalogRootLink ? normalizeNavPath(catalogRootLink) : ''; const target = catalog && catalog.startsWith(`${parent}/`) ? catalog : parent; if (target === normalizeNavPath(currentUrl)) return null; const query = currentUrl.split('#')[0]?.split('?')[1]; return { routerLink: target, ...(query ? { queryParams: Object.fromEntries(new URLSearchParams(query)) } : {}) }; }
export interface RouteSnapshotLike { url?: readonly ({ path?: string } | string)[]; firstChild?: RouteSnapshotLike | null; }
export function resolveParentPathFromRootSnapshot(root: RouteSnapshotLike): string | null {
  const levels: string[][] = [];
  let node: RouteSnapshotLike | null | undefined = root;
  while (node) { levels.push((node.url ?? []).map(segment => typeof segment === 'string' ? segment : segment.path ?? '').filter(Boolean)); node = node.firstChild; }
  const current = levels.flat().filter(Boolean).join('/');
  for (let index = levels.length - 2; index >= 0; index--) { const parent = levels.slice(0, index + 1).flat().filter(Boolean).join('/'); if (parent && parent !== current) return `/${parent}`; }
  return null;
}
export function buildBreadcrumbsFromSideNav(url: string, items: readonly AfricaniesSideNavItem[]): AfricaniesNavItem[] { const path = normalizeNavPath(url); const match = items.find(item => isNavItemActive(item, path)); const home: AfricaniesNavItem = { id: 'home', label: 'Home', routerLink: navHref(items[0] ?? { label: '' }) || '/overview', icon: 'home' }; const segments = path.split('/').filter(Boolean); if (!match) return [home, { id: path, label: segments[segments.length - 1] ?? 'Overview' }]; return [home, { ...match, routerLink: navHref(match) || undefined }]; }
export const isExternalHref = (href: string): boolean => /^(?:https?:)?\/\//.test(href);
export function navigateTo(href: string, options: { history?: History; location?: Location; replace?: boolean; callback?: (href: string) => void } = {}): void {
  if (options.callback) { options.callback(href); return; }
  if (isExternalHref(href)) { options.location?.assign(href); return; }
  const history = options.history;
  if (!history) return;
  if (options.replace) history.replaceState(null, '', href);
  else history.pushState(null, '', href);
  globalThis.dispatchEvent?.(new PopStateEvent('popstate'));
}
export const routeIsActive = (href: string, pathname: string, exact = false): boolean => exact ? pathname === href : pathname === href || pathname.startsWith(`${href.replace(/\/$/, '')}/`);

abstract class ViewElement extends HTMLElementBase {
  protected root: ShadowRoot | null = null;
  connectedCallback(): void { if (!this.root && typeof this.attachShadow === 'function') this.root = this.attachShadow({ mode: 'open' }); this.render(); }
  attributeChangedCallback(): void { this.render(); }
  protected abstract render(): void;
  protected markup(value: string): void { if (this.root) this.root.innerHTML = withAfricaniesShadowStyles(value); }
  protected emit(name: string, detail: unknown): void { this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail })); }
}

export interface BreadcrumbItem extends RouteTarget { current?: boolean; }
export class BreadcrumbComponent extends ViewElement {
  #items: readonly BreadcrumbItem[] = [];
  set items(value: readonly BreadcrumbItem[]) { this.#items = value; this.render(); } get items(): readonly BreadcrumbItem[] { return this.#items; }
  protected render(): void { this.markup(`<nav aria-label="Breadcrumb"><ol>${this.#items.map((item, index) => `<li>${item.current || index === this.#items.length - 1 ? `<span aria-current="page">${esc(item.label)}</span>` : `<a href="${esc(item.href)}">${esc(item.label)}</a>`}</li>`).join('')}</ol></nav>`); }
}

export interface TabItem { id: string; label: string; disabled?: boolean; }
export class TabsComponent extends ViewElement {
  #tabs: readonly TabItem[] = []; #selected = '';
  #keydown = (event: KeyboardEvent): void => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; const enabled = this.#tabs.filter(tab => !tab.disabled); const current = enabled.findIndex(tab => tab.id === this.#selected); const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length; if (enabled[next]) { event.preventDefault(); this.selected = enabled[next].id; this.root?.querySelector<HTMLElement>(`[data-id="${CSS.escape(this.#selected)}"]`)?.focus(); } };
  set tabs(value: readonly TabItem[]) { this.#tabs = value; if (!this.#selected) this.#selected = value.find(tab => !tab.disabled)?.id ?? ''; this.render(); }
  set selected(value: string) { this.#selected = value; this.render(); this.emit('tab-change', { id: value }); } get selected(): string { return this.#selected; }
  connectedCallback(): void { super.connectedCallback(); this.addEventListener('keydown', this.#keydown); }
  disconnectedCallback(): void { this.removeEventListener('keydown', this.#keydown); }
  protected render(): void { this.markup(`<div role="tablist">${this.#tabs.map(tab => `<button role="tab" data-id="${esc(tab.id)}" aria-selected="${tab.id === this.#selected}" tabindex="${tab.id === this.#selected ? 0 : -1}"${tab.disabled ? ' disabled' : ''}>${esc(tab.label)}</button>`).join('')}</div><slot name="${esc(this.#selected)}"></slot>`); this.root?.querySelectorAll<HTMLButtonElement>('[role="tab"]').forEach(button => button.addEventListener('click', () => this.selected = button.dataset.id ?? '')); }
}
export class SegmentComponent extends TabsComponent {}

export interface SideNavItem extends RouteTarget { disabled?: boolean; }
export class SideNavComponent extends ViewElement { #items: readonly SideNavItem[] = []; set items(value: readonly SideNavItem[]) { this.#items = value; this.render(); } protected render(): void { this.markup(`<nav aria-label="Primary"><ul>${this.#items.map(item => `<li><a href="${esc(item.href)}"${item.disabled ? ' aria-disabled="true" tabindex="-1"' : ''}>${esc(item.label)}</a></li>`).join('')}</ul></nav>`); } }

export interface ShippingModeSwitchController { getMode(): 'sfn' | 'stn'; setMode(mode: 'sfn' | 'stn'): boolean | Promise<boolean>; subscribe?(listener: (mode: 'sfn' | 'stn') => void): () => void; }
export class ShippingModeSwitchComponent extends ViewElement {
  static readonly observedAttributes = ['mode', 'collapsed', 'disabled'];
  #controller: ShippingModeSwitchController | null = null;
  #unsubscribe: (() => void) | null = null;
  #click = (event: Event): void => { const button = (event.target as Element).closest?.('button[data-mode]') as HTMLButtonElement | null; if (button && !this.hasAttribute('disabled')) void this.select(button.dataset.mode === 'stn' ? 'stn' : 'sfn'); };
  set controller(value: ShippingModeSwitchController | null) { this.#unsubscribe?.(); this.#controller = value; this.#unsubscribe = value?.subscribe?.(mode => { this.setAttribute('mode', mode); }) ?? null; if (value) this.setAttribute('mode', value.getMode()); }
  get controller(): ShippingModeSwitchController | null { return this.#controller; }
  connectedCallback(): void { super.connectedCallback(); this.root?.addEventListener('click', this.#click); }
  disconnectedCallback(): void { this.root?.removeEventListener('click', this.#click); this.#unsubscribe?.(); this.#unsubscribe = null; }
  async select(mode: 'sfn' | 'stn'): Promise<boolean> { const accepted = await (this.#controller?.setMode(mode) ?? true); if (!accepted) return false; this.setAttribute('mode', mode); this.emit('mode-change', { mode }); return true; }
  protected render(): void {
    const mode = this.getAttribute('mode') === 'stn' ? 'stn' : 'sfn'; const collapsed = this.hasAttribute('collapsed'); const disabled = this.hasAttribute('disabled');
    const card = (option: 'sfn' | 'stn', label: string, direction: string): string => `<button part="mode-card" data-mode="${option}" data-selected="${mode === option}" type="button" role="radio" aria-checked="${mode === option}" aria-label="${label}"${disabled ? ' disabled' : ''}><svg part="mode-glyph" data-direction="${option}" viewBox="0 0 122.88 107.54" aria-hidden="true" focusable="false"><path d="M15 77c15-20 34-30 55-38l-12-17 8-4 24 15 20-8 5 6-18 13-5 31-7 3-8-27C55 60 38 70 24 88zM20 81a46 46 0 1 0 7-58M34 21h48M25 48h73M29 76h60" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>${collapsed ? '' : `<span part="mode-label"><span>Shipping</span><span>${direction}</span></span>`}</button>`;
    this.markup(`${collapsed ? '' : '<p part="mode-heading">Shipping mode</p>'}<div part="mode-options" data-collapsed="${collapsed}" role="radiogroup" aria-label="Shipping mode">${card('stn', 'Shipping to Nigeria', 'to Nigeria')}${card('sfn', 'Shipping from Nigeria', 'from Nigeria')}</div>`);
  }
}

export interface TableColumn<T = unknown> { key: keyof T & string; label: string; sortable?: boolean; render?: (row: T) => string; }
export interface TableSortChange { active: string; direction: 'asc' | 'desc' | ''; }
export class TableComponent<T = unknown> extends ViewElement {
  #columns: readonly TableColumn<T>[] = []; #rows: readonly T[] = []; #sort: TableSortChange = { active: '', direction: '' };
  rowDetail: ((row: T) => string) | null = null;
  set columns(value: readonly TableColumn<T>[]) { this.#columns = value; this.render(); } set rows(value: readonly T[]) { this.#rows = value; this.render(); }
  sort(key: string): void { this.#sort = { active: key, direction: this.#sort.active !== key ? 'asc' : this.#sort.direction === 'asc' ? 'desc' : this.#sort.direction === 'desc' ? '' : 'asc' }; this.emit('sort-change', this.#sort); this.render(); }
  protected render(): void { this.markup(`<table><thead><tr>${this.#columns.map(column => `<th scope="col"${column.sortable ? ` aria-sort="${this.#sort.active === column.key ? this.#sort.direction === 'asc' ? 'ascending' : this.#sort.direction === 'desc' ? 'descending' : 'none' : 'none'}"><button data-sort="${esc(column.key)}">${esc(column.label)}</button>` : `>${esc(column.label)}`}</th>`).join('')}</tr></thead><tbody>${this.#rows.map(row => `<tr>${this.#columns.map(column => `<td>${column.render ? column.render(row) : esc((row as Record<string, unknown>)[column.key])}</td>`).join('')}</tr>${this.rowDetail ? `<tr part="detail"><td colspan="${this.#columns.length}">${this.rowDetail(row)}</td></tr>` : ''}`).join('')}</tbody></table>`); this.root?.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach(button => button.addEventListener('click', () => this.sort(button.dataset.sort ?? ''))); }
}

export class PaginationComponent extends ViewElement {
  static readonly observedAttributes = ['page', 'total-pages', 'disabled'];
  protected render(): void { const page = Math.max(1, Number(this.getAttribute('page') ?? 1)); const total = Math.max(1, Number(this.getAttribute('total-pages') ?? 1)); this.markup(`<nav aria-label="Pagination"><button data-page="${page - 1}" aria-label="Previous page"${page <= 1 ? ' disabled' : ''}>Previous</button><span aria-live="polite">Page ${page} of ${total}</span><button data-page="${page + 1}" aria-label="Next page"${page >= total ? ' disabled' : ''}>Next</button></nav>`); this.root?.querySelectorAll<HTMLButtonElement>('[data-page]').forEach(button => button.addEventListener('click', () => this.emit('page-change', { page: Number(button.dataset.page) }))); }
}
export interface StepDefinition { id: string; label: string; optional?: boolean; disabled?: boolean; }
export class StepperComponent extends ViewElement { #steps: readonly StepDefinition[] = []; #active = 0; set steps(value: readonly StepDefinition[]) { this.#steps = value; this.render(); } set activeIndex(value: number) { this.#active = Math.max(0, Math.min(value, this.#steps.length - 1)); this.render(); } protected render(): void { this.markup(`<ol aria-label="Progress">${this.#steps.map((step, index) => `<li><button data-step="${index}"${index === this.#active ? ' aria-current="step"' : ''}${step.disabled ? ' disabled' : ''}>${esc(step.label)}${step.optional ? ' (optional)' : ''}</button></li>`).join('')}</ol><slot name="${esc(this.#steps[this.#active]?.id ?? '')}"></slot>`); this.root?.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(button => button.addEventListener('click', () => { this.activeIndex = Number(button.dataset.step); this.emit('step-change', { index: this.#active, step: this.#steps[this.#active] }); })); } }
export class PageHeaderComponent extends ViewElement { static readonly observedAttributes = ['heading', 'description']; protected render(): void { this.markup(`<header><div><h1>${esc(this.getAttribute('heading') ?? '')}</h1>${this.getAttribute('description') ? `<p>${esc(this.getAttribute('description'))}</p>` : ''}</div><div part="actions"><slot name="actions"></slot></div></header>`); } }

export const AFRICANIES_NAVIGATION_DATA_ELEMENTS = Object.freeze({ 'africanies-breadcrumb': BreadcrumbComponent, 'africanies-tabs': TabsComponent, 'africanies-segment': SegmentComponent, 'africanies-shipping-mode-switch': ShippingModeSwitchComponent, 'africanies-side-nav': SideNavComponent, 'africanies-table': TableComponent, 'africanies-pagination': PaginationComponent, 'africanies-stepper': StepperComponent, 'africanies-page-header': PageHeaderComponent });
