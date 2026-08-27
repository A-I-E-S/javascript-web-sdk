type HTMLElementConstructor = typeof HTMLElement;
const HTMLElementBase: HTMLElementConstructor = (globalThis.HTMLElement ?? class {}) as HTMLElementConstructor;
const esc = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface RouteTarget { href: string; label: string; }
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
  protected markup(value: string): void { if (this.root) this.root.innerHTML = value; }
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

export class ShippingModeSwitchComponent extends ViewElement {
  static readonly observedAttributes = ['mode', 'disabled'];
  #click = (event: Event): void => { const button = (event.target as Element).closest?.('button[data-mode]') as HTMLButtonElement | null; if (button && !this.hasAttribute('disabled')) { this.setAttribute('mode', button.dataset.mode ?? 'sfn'); this.emit('mode-change', { mode: button.dataset.mode }); } };
  connectedCallback(): void { super.connectedCallback(); this.root?.addEventListener('click', this.#click); } disconnectedCallback(): void { this.root?.removeEventListener('click', this.#click); }
  protected render(): void { const mode = this.getAttribute('mode') === 'stn' ? 'stn' : 'sfn'; this.markup(`<div role="group" aria-label="Shipping mode"><button data-mode="sfn" aria-pressed="${mode === 'sfn'}">Ship from Nigeria</button><button data-mode="stn" aria-pressed="${mode === 'stn'}">Ship to Nigeria</button></div>`); }
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
