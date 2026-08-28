import type {
  FilterFieldModel,
  FilterOptionModel,
  FilterStateModel,
  ModuleFilterConfigModel,
} from '../../models/dist/index.js';
import {
  cloneFilterState,
  emptyFilterState,
  filterQueryKeys,
  fromFilterParams,
  hasFilterParams,
  resetFilterState,
  toFilterParams,
} from '../../models/dist/index.js';
import type { DrawerService, AfricaniesOverlayRef } from './overlay.js';
import { withAfricaniesShadowStyles } from './styles.js';
type HTMLElementConstructor = typeof HTMLElement;
const HTMLElementBase: HTMLElementConstructor = (globalThis.HTMLElement ?? class {}) as HTMLElementConstructor;
const esc = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
abstract class MiscElement extends HTMLElementBase { protected root: ShadowRoot | null = null; connectedCallback(): void { if (!this.root && typeof this.attachShadow === 'function') this.root = this.attachShadow({ mode: 'open' }); this.render(); } attributeChangedCallback(name: string, previous: string | null, value: string | null): void { void name; void previous; void value; this.render(); } protected abstract render(): void; protected html(value: string): void { if (this.root) this.root.innerHTML = withAfricaniesShadowStyles(value); } }

export interface ActionMenuItem { id: string; label: string; disabled?: boolean; danger?: boolean; }
export class ActionMenuComponent extends MiscElement {
  #items: readonly ActionMenuItem[] = []; #open = false;
  #click = (event: Event): void => { const target = (event.target as Element).closest?.('[data-action]') as HTMLElement | null; if (!target) return; this.dispatchEvent(new CustomEvent('action-select', { bubbles: true, composed: true, detail: { id: target.dataset.action } })); this.open = false; };
  #keydown = (event: KeyboardEvent): void => { if (event.key === 'Escape') { this.open = false; return; } const items = [...(this.root?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]; if (!['ArrowDown', 'ArrowUp'].includes(event.key) || items.length === 0) return; event.preventDefault(); const current = items.indexOf(this.root?.activeElement as HTMLElement); items[(current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); };
  set items(value: readonly ActionMenuItem[]) { this.#items = value; this.render(); } set open(value: boolean) { this.#open = value; this.render(); } get open(): boolean { return this.#open; }
  connectedCallback(): void { super.connectedCallback(); this.root?.addEventListener('click', this.#click); this.addEventListener('keydown', this.#keydown); }
  disconnectedCallback(): void { this.root?.removeEventListener('click', this.#click); this.removeEventListener('keydown', this.#keydown); }
  protected render(): void { this.html(`<div role="menu"${this.#open ? '' : ' hidden'}>${this.#items.map(item => `<button role="menuitem" data-action="${esc(item.id)}"${item.disabled ? ' disabled' : ''}${item.danger ? ' data-danger="true"' : ''}>${esc(item.label)}</button>`).join('')}</div>`); }
}
export class ActionMenuTriggerComponent extends MiscElement { #click = (): void => { this.dispatchEvent(new CustomEvent('menu-toggle', { bubbles: true, composed: true })); }; connectedCallback(): void { super.connectedCallback(); this.root?.addEventListener('click', this.#click); } disconnectedCallback(): void { this.root?.removeEventListener('click', this.#click); } protected render(): void { this.html('<button part="trigger" type="button" aria-haspopup="menu"><slot></slot></button>'); } }

export class AvatarComponent extends MiscElement { static readonly observedAttributes = ['src', 'name', 'size']; protected render(): void { const src = this.getAttribute('src'); const name = this.getAttribute('name') ?? ''; const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(); this.html(`<span part="avatar" data-size="${esc(this.getAttribute('size') ?? 'medium')}" role="img" aria-label="${esc(name || 'User')}">${src ? `<img src="${esc(src)}" alt="">` : esc(initials || '?')}</span>`); } }
export class AvatarMenuComponent extends ActionMenuComponent {}
export class BrandLogoComponent extends MiscElement { static readonly observedAttributes = ['src', 'alt']; protected render(): void { this.html(`<img part="logo" src="${esc(this.getAttribute('src') ?? '')}" alt="${esc(this.getAttribute('alt') ?? 'AFRICANIES')}">`); } }
export class ImageFallbackFrameComponent extends MiscElement { static readonly observedAttributes = ['src', 'alt', 'fallback']; #error = (): void => { const image = this.root?.querySelector('img'); if (image) image.hidden = true; const fallback = this.root?.querySelector<HTMLElement>('[part="fallback"]'); if (fallback) fallback.hidden = false; }; connectedCallback(): void { super.connectedCallback(); this.root?.querySelector('img')?.addEventListener('error', this.#error); } disconnectedCallback(): void { this.root?.querySelector('img')?.removeEventListener('error', this.#error); } protected render(): void { this.html(`<img part="image" src="${esc(this.getAttribute('src') ?? '')}" alt="${esc(this.getAttribute('alt') ?? '')}"><span part="fallback" hidden>${esc(this.getAttribute('fallback') ?? 'Image unavailable')}</span>`); } }
export const normalizeCarrierName = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const carrierLogoUrl = (carrier: string, baseUrl = '/assets/carriers'): string => `${baseUrl.replace(/\/$/, '')}/${normalizeCarrierName(carrier)}.svg`;
export class CarrierLogoComponent extends MiscElement { static readonly observedAttributes = ['carrier', 'base-url']; protected render(): void { const carrier = this.getAttribute('carrier') ?? ''; this.html(`<img part="logo" src="${esc(carrierLogoUrl(carrier, this.getAttribute('base-url') ?? undefined))}" alt="${esc(carrier)} logo">`); } }

export type ImageShape = 'circle' | 'rounded' | 'square';
export type ImageFit = 'cover' | 'contain';
export class ImageComponent extends MiscElement {
  static readonly observedAttributes = ['src', 'alt', 'frame-class', 'shape', 'fit', 'fallback', 'fallback-class', 'placeholder-icon', 'icon-size'];
  #loaded = false;
  #failed = false;
  #load = (): void => { this.#loaded = true; this.#failed = false; this.render(); };
  #error = (): void => { this.#failed = true; this.#loaded = false; this.render(); };
  attributeChangedCallback(name: string, previous: string | null, value: string | null): void { if (name === 'src' && previous !== value) { this.#loaded = false; this.#failed = false; } super.attributeChangedCallback(name, previous, value); }
  protected render(): void {
    const src = this.getAttribute('src')?.trim() ?? '';
    const shape = this.getAttribute('shape') ?? 'rounded';
    const fit = this.getAttribute('fit') === 'contain' ? 'contain' : 'cover';
    const pending = Boolean(src) && !this.#loaded && !this.#failed;
    const placeholder = !src || pending || this.#failed;
    const fallback = this.getAttribute('fallback');
    this.html(`<div part="frame" data-shape="${esc(shape)}" class="${esc(this.getAttribute('frame-class') ?? 'h-40 w-40')}">${src ? `<img part="image" src="${esc(src)}" alt="${esc(this.getAttribute('alt') ?? '')}" style="object-fit:${fit}"${pending ? ' data-pending="true"' : ''}>` : ''}${placeholder ? `<div part="placeholder" aria-hidden="true">${pending ? '<span part="spinner">⟳</span>' : fallback ? `<span part="fallback">${esc(fallback)}</span>` : `<africanies-icon name="${esc(this.getAttribute('placeholder-icon') ?? 'picture')}" size="${esc(this.getAttribute('icon-size') ?? '20')}"></africanies-icon>`}</div>` : ''}</div>`);
    this.root?.querySelector('img')?.addEventListener('load', this.#load);
    this.root?.querySelector('img')?.addEventListener('error', this.#error);
  }
}

export type AvatarSize = 'sm' | 'md' | 'lg';
export type BrandLogoSize = 'sm' | 'md' | 'lg';
export type CarrierLogoSize = 'sm' | 'md';
export type CarrierLogoSlug = 'dhl';
export const AFRICANIES_BRAND_LOGO_URL = '/assets/africanies/brand-logo.svg';
export const AFRICANIES_BRAND_LOGO_MINI_URL = '/assets/africanies/brand-logo-mini.svg';
export function normalizeCarrierLogoSlug(value: string | null | undefined): CarrierLogoSlug | null { return value?.trim().toLowerCase() === 'dhl' ? 'dhl' : null; }

const DELIVERY_VENDOR_ROWS = Object.freeze([{ id: 'amazon', name: 'Amazon' }, { id: 'dhl', name: 'DHL' }, { id: 'fedex', name: 'FedEx' }, { id: 'usps', name: 'USPS' }, { id: 'ups', name: 'UPS' }, { id: 'others', name: 'Others' }]);
export function deliveryVendorSelectOptions(includeWalkIn = false): Array<{ value: string; label: string }> { const rows = includeWalkIn ? [...DELIVERY_VENDOR_ROWS, { id: 'walk-in', name: 'Walk-In' }] : DELIVERY_VENDOR_ROWS; return rows.map(row => ({ value: row.id, label: row.name })); }
export function deliveryVendorOptionsForStoredValue(storedValue: string, baseOptions: readonly { value: string; label: string }[] = deliveryVendorSelectOptions()): Array<{ value: string; label: string }> { const raw = storedValue.trim(); const normalized = raw.toLowerCase(); if (!raw || DELIVERY_VENDOR_ROWS.some(row => row.id === normalized)) return [...baseOptions]; return [{ label: 'Others', value: raw }, ...baseOptions]; }
export function deliveryVendorSelected(storedValue: string, baseOptions: readonly { value: string; label: string }[] = deliveryVendorSelectOptions()): { value: string; label: string } | null { const raw = storedValue.trim(); if (!raw) return null; const normalized = raw.toLowerCase(); const value = DELIVERY_VENDOR_ROWS.some(row => row.id === normalized) ? normalized : raw; return deliveryVendorOptionsForStoredValue(value, baseOptions).find(row => row.value === value) ?? null; }

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';
export type InfoPopoverPlacement = TooltipPlacement;
export class TooltipComponent extends MiscElement { static readonly observedAttributes = ['message', 'placement']; protected render(): void { this.html(`<span part="trigger" tabindex="0" aria-describedby="tooltip"><slot></slot></span><span part="tooltip" data-placement="${esc(this.getAttribute('placement') ?? 'top')}" id="tooltip" role="tooltip">${esc(this.getAttribute('message') ?? '')}</span>`); } }
export class InfoPopoverComponent extends MiscElement { static readonly observedAttributes = ['open']; #click = (event: Event): void => { if ((event.target as Element).closest?.('button')) this.toggleAttribute('open'); }; connectedCallback(): void { super.connectedCallback(); this.root?.addEventListener('click', this.#click); } disconnectedCallback(): void { this.root?.removeEventListener('click', this.#click); } protected render(): void { const open = this.hasAttribute('open'); this.html(`<button type="button" aria-expanded="${open}" aria-controls="popover"><slot name="trigger">Info</slot></button><div id="popover" role="dialog"${open ? '' : ' hidden'}><slot></slot></div>`); } }
export class AppShellComponent extends MiscElement { protected render(): void { this.html('<div part="shell"><slot name="side-nav"></slot><div part="main"><slot name="header"></slot><main><slot></slot></main></div></div>'); } }
export class HeaderComponent extends MiscElement { protected render(): void { this.html('<header><slot name="start"></slot><slot></slot><slot name="end"></slot></header>'); } }
export class ContentHeaderComponent extends MiscElement { static readonly observedAttributes = ['heading', 'description']; protected render(): void { this.html(`<header><div><h2>${esc(this.getAttribute('heading') ?? '')}</h2>${this.getAttribute('description') ? `<p>${esc(this.getAttribute('description'))}</p>` : ''}</div><slot name="actions"></slot></header>`); } }

export interface HeaderGreeting { kicker: string; name: string; }
export type HeaderGreetingPeriod = 'wee-hours' | 'dawn' | 'early-morning' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'late-night';
export type HeaderWeatherKind = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';
export interface HeaderWeather { kind: HeaderWeatherKind; temperatureC?: number; city?: string; }
const GREETING_KICKERS: Record<HeaderGreetingPeriod, readonly string[]> = {
  'wee-hours': ['Moonlit chat?', 'Still here?', 'Quiet hours.', 'Night-owl desk.', "The city's asleep.", 'Burning the midnight oil?', 'Late-night glow.', 'Stars are out.', 'Hushed shift.', 'After midnight.', 'Just us and the dark.', 'Owl hours.'],
  dawn: ['First light.', 'Dawn patrol.', 'Before the rush.', "The sky's waking up.", 'Early bird.', 'Sunrise shift.', "Coffee's brewing.", 'Soft morning.', 'Ahead of the day.', 'Pale gold hour.', 'World still yawning.', 'Catch the quiet.'],
  'early-morning': ['Rise and shine.', "Let's ease in.", 'Bright and early.', 'Warm-up lap.', "Day's just starting.", 'Stretch and go.', 'Morning pages.', 'Good hour to begin.', 'Easy does it.', 'First coffee?', 'Laces tied.', 'Fresh notebook energy.'],
  morning: ['Morning momentum.', 'Ready to ship?', "Let's make it count.", 'Onward.', 'Full steam.', "Let's clear the decks.", 'Good hour for it.', 'Inbox awaits.', "Let's get into it.", 'Lights are on.', 'Plotting the day?', 'Open the windows.'],
  midday: ['Midday check-in.', "Sun's high.", 'Halfway there.', 'Peak hours.', 'Lunch-adjacent.', 'Keep the pace.', 'Quick reset?', 'Still rolling.', 'High noon.', 'Midday desk.', 'Second act.', 'Refill and resume.'],
  afternoon: ['Afternoon stretch.', 'Second wind?', 'Back at it.', 'Steady on.', 'Still plenty of day.', 'Carry it forward.', 'Afternoon light.', 'Keep going.', 'Golden grind.', 'Long-shadow hours.', 'Push the next tile.', 'Not done yet.'],
  dusk: ['Golden hour.', 'Evening glow.', 'Last daylight.', 'Wrapping the day?', 'Soft landing.', 'Dusk desk.', 'Sunset shift.', 'Almost there.', "Light's going gold.", 'Close of play?', 'Sky on fire.', 'Blue hour soon.'],
  evening: ['Evening session.', "Night's coming in.", 'After hours?', 'Evening quiet.', 'One more round?', 'Lights are low.', 'Evening desk.', 'Unwind or push?', 'Settling in.', 'Lamp-light hours.', 'City lights on.', 'Slow the tempo?'],
  'late-night': ['Moonlit chat?', 'Late shift.', 'Quiet tonight.', 'Still glowing?', 'Night desk.', 'Hushed hours.', 'Wrap it gently?', 'Starside.', 'Last lap?', 'Soft landing tonight.', 'The moon is clocked in.', 'Dim the noise.']
};
const WEATHER_KICKERS: Record<HeaderWeatherKind, readonly string[]> = {
  clear: ['Clear skies.', "Sun's out.", 'Bright out there.', 'Blue overhead.'], cloudy: ['Soft grey day.', 'Cloud cover.', 'Overcast calm.', 'Grey but going.'], fog: ['Foggy out.', 'Misty hours.', 'Wrapped in fog.', 'Low and quiet.'], drizzle: ['Light drizzle.', 'Soft rain.', 'Grey and gentle.', 'A little wet out.'], rain: ['Rainy round?', 'Wet out there.', 'Cozy weather for it.', 'Rain on the glass.'], snow: ['Snow in the air.', 'Flurries out.', 'Cold sparkle.', 'Winter at the window.'], storm: ['Stormy out.', 'Wild skies.', 'Hold tight.', 'Thunder weather.']
};
const NOTABLE_WEATHER = new Set<HeaderWeatherKind>(['rain', 'snow', 'storm', 'fog']);
export function headerGreetingFirstName(value: string | null | undefined): string { const trimmed = value?.trim() ?? ''; return trimmed ? (trimmed.split(/\s+/)[0] ?? '') : ''; }
export function headerGreetingPeriod(now: Date): HeaderGreetingPeriod { const hour = now.getHours(); return hour < 5 ? 'wee-hours' : hour < 7 ? 'dawn' : hour < 9 ? 'early-morning' : hour < 12 ? 'morning' : hour < 14 ? 'midday' : hour < 17 ? 'afternoon' : hour < 19 ? 'dusk' : hour < 22 ? 'evening' : 'late-night'; }
export function headerGreetingPool(period: HeaderGreetingPeriod, weather: HeaderWeather | null = null): readonly string[] { const periodLines = GREETING_KICKERS[period]; if (!weather) return periodLines; const temperature = weather.temperatureC === undefined || !Number.isFinite(weather.temperatureC) ? [] : weather.temperatureC >= 32 ? ["Heat's on.", 'Warm one.'] : weather.temperatureC <= 12 ? ['Chilly out.', 'Crisp air.'] : []; const weatherLines = [...WEATHER_KICKERS[weather.kind], ...temperature]; return NOTABLE_WEATHER.has(weather.kind) ? [...weatherLines, ...weatherLines, ...periodLines] : [...periodLines, ...weatherLines]; }
export function pickHeaderGreeting(name: string | null | undefined, now = new Date(), weather: HeaderWeather | null = null): HeaderGreeting | null { const first = headerGreetingFirstName(name); if (!first) return null; const period = headerGreetingPeriod(now); const pool = headerGreetingPool(period, weather); const key = `${first.toLowerCase()}|${now.getFullYear()}-${now.getMonth()}-${now.getDate()}|${period}|${weather?.kind ?? 'none'}`; let hash = 0; for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0; return { kicker: pool[hash % pool.length] ?? pool[0] ?? '', name: first }; }

export class AppShellHeaderComponent extends MiscElement {
  static readonly observedAttributes = ['user-name', 'greeting-name', 'show-clock', 'show-notifications', 'density'];
  #timer: ReturnType<typeof setInterval> | null = null;
  connectedCallback(): void { super.connectedCallback(); this.#timer ??= setInterval(() => this.render(), 60_000); }
  disconnectedCallback(): void { if (this.#timer) clearInterval(this.#timer); this.#timer = null; }
  protected render(): void { const greeting = pickHeaderGreeting(this.getAttribute('greeting-name') ?? this.getAttribute('user-name')); const showClock = this.getAttribute('show-clock') !== 'false'; this.html(`<header part="app-header" data-density="${esc(this.getAttribute('density') ?? 'desktop')}"><div part="greeting">${greeting ? `<span>${esc(greeting.kicker)}</span><strong>${esc(greeting.name)}</strong>` : ''}</div><slot></slot>${showClock ? `<time datetime="${new Date().toISOString()}">${esc(new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date()))}</time>` : ''}${this.getAttribute('show-notifications') !== 'false' ? '<button type="button" part="notifications" aria-label="Open notifications">🔔</button>' : ''}<slot name="end"></slot></header>`); }
}
export class AppShellContentHeaderComponent extends MiscElement {
  static readonly observedAttributes = ['title', 'subtitle', 'back-href', 'back-label'];
  protected render(): void { const back = this.getAttribute('back-href'); this.html(`<section part="content-header">${back ? `<a part="back" href="${esc(back)}" aria-label="${esc(this.getAttribute('back-label') ?? 'Back')}">‹</a>` : ''}<slot name="breadcrumbs"></slot>${this.getAttribute('title') ? `<h1>${esc(this.getAttribute('title'))}</h1>` : ''}${this.getAttribute('subtitle') ? `<p>${esc(this.getAttribute('subtitle'))}</p>` : ''}<slot name="actions"></slot></section>`); }
}

export interface NotificationPage<T = unknown> { data: readonly T[]; has_next_page?: boolean; }
export type NotificationPageResult<T = unknown> = NotificationPage<T>;
export interface AfricaniesNotification { id: string; title?: string; message?: string; read?: boolean; [key: string]: unknown; }
export interface NotificationDrawerData<T = unknown> { adapter: NotificationAdapter<T>; }
export interface NotificationDrawerResult { readIds?: readonly string[]; }
export interface NotificationAdapter<T = unknown> { list(page: number): Promise<NotificationPage<T>>; markRead?(id: string): Promise<unknown>; }
export class NotificationDrawerService<T = unknown> {
  constructor(private readonly drawer: DrawerService, private readonly adapter: NotificationAdapter<T>) {}
  open(): AfricaniesOverlayRef<unknown> { return this.drawer.open(({ document }) => { const panel = document.createElement('africanies-notification-drawer') as NotificationDrawerComponent<T>; panel.adapter = this.adapter; return panel; }, { dismissible: true }); }
}
export class NotificationDrawerComponent<T = unknown> extends MiscElement { adapter: NotificationAdapter<T> | null = null; #items: T[] = []; #page = 0; #loading = false; async loadMore(): Promise<void> { if (!this.adapter || this.#loading) return; this.#loading = true; this.render(); try { const page = await this.adapter.list(this.#page + 1); this.#page += 1; this.#items.push(...page.data); } finally { this.#loading = false; this.render(); } } protected render(): void { this.html(`<section aria-label="Notifications" aria-busy="${this.#loading}"><slot name="header"></slot><div part="items">${this.#items.map(item => `<div part="item">${esc(JSON.stringify(item))}</div>`).join('')}</div><button type="button" part="load-more"${this.#loading ? ' disabled' : ''}>Load more</button></section>`); this.root?.querySelector('[part="load-more"]')?.addEventListener('click', () => void this.loadMore()); } }
export class NotificationDrawerPanel<T = unknown> extends NotificationDrawerComponent<T> { close(): void { this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true })); } }

export class FilterQueryService {
  constructor(private readonly history?: History, private readonly location?: Location) {}
  private snapshot(): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(this.location?.search ?? ''));
  }
  private urlFrom(values: Record<string, unknown>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value != null && value !== '') query.set(key, String(value));
    return `${this.location?.pathname ?? ''}${query.size ? `?${query}` : ''}${this.location?.hash ?? ''}`;
  }
  hasParams(config?: ModuleFilterConfigModel): boolean {
    const values = this.snapshot();
    return config ? hasFilterParams(values, config) : Object.keys(values).length > 0;
  }
  read(config?: ModuleFilterConfigModel): FilterStateModel | Record<string, string> {
    const values = this.snapshot();
    return config ? fromFilterParams(values, config) : values;
  }
  write(state: FilterStateModel | Record<string, unknown>, configOrReplace?: ModuleFilterConfigModel | boolean, replace = true): void {
    if (typeof configOrReplace === 'boolean') {
      const values = state as Record<string, unknown>;
      (configOrReplace ? this.history?.replaceState : this.history?.pushState)?.call(this.history, null, '', this.urlFrom(values));
      return;
    }
    const config = configOrReplace;
    if (!config) {
      this.history?.replaceState(null, '', this.urlFrom(state as Record<string, unknown>));
      return;
    }
    const next: Record<string, unknown> = { ...this.snapshot() };
    for (const key of filterQueryKeys(config)) delete next[key];
    for (const [key, value] of Object.entries(toFilterParams(state as FilterStateModel, config))) if (value != null && value !== '') next[key] = value;
    (replace ? this.history?.replaceState : this.history?.pushState)?.call(this.history, null, '', this.urlFrom(next));
  }
  clear(config?: ModuleFilterConfigModel): void {
    if (!config) {
      this.history?.replaceState(null, '', this.urlFrom({}));
      return;
    }
    const next: Record<string, unknown> = { ...this.snapshot() };
    for (const key of filterQueryKeys(config)) delete next[key];
    this.history?.replaceState(null, '', this.urlFrom(next));
  }
  setPage(page: number, config?: ModuleFilterConfigModel): void {
    const next: Record<string, unknown> = { ...this.snapshot(), [(config?.pagination?.pageParam ?? 'page')]: page };
    this.history?.replaceState(null, '', this.urlFrom(next));
  }
  setSize(size: number, config?: ModuleFilterConfigModel): void {
    const pageKey = config?.pagination?.pageParam ?? 'page';
    const sizeKey = config?.pagination?.sizeParam ?? 'size';
    const next: Record<string, unknown> = { ...this.snapshot(), [pageKey]: 1, [sizeKey]: size };
    this.history?.replaceState(null, '', this.urlFrom(next));
  }
}
export interface FilterResolverAdapter { resolve(config: unknown): Promise<unknown>; }
export interface FilterDrawerData { config: ModuleFilterConfigModel; state?: FilterStateModel; title?: string; optionLists?: Record<string, FilterOptionModel[]>; }
export interface FilterDrawerResult { applied: boolean; state: FilterStateModel; params: Record<string, string | number | undefined>; }
export class FilterDrawerService {
  constructor(private readonly drawer: DrawerService, private readonly query: FilterQueryService, private readonly resolver?: FilterResolverAdapter) {}
  open(configOrData: ModuleFilterConfigModel | FilterDrawerData): AfricaniesOverlayRef<FilterDrawerResult> {
    const data = ('config' in configOrData ? configOrData : { config: configOrData }) as FilterDrawerData;
    return this.drawer.open(({ document, ref }) => {
      const panel = document.createElement('africanies-filter-drawer') as FilterDrawerComponent;
      const config = data.config;
      panel.config = config;
      panel.heading = data.title ?? 'Filters';
      panel.state = this.query.hasParams(config) ? this.query.read(config) as FilterStateModel : cloneFilterState(data.state);
      panel.optionLists = data.optionLists ?? awaitableResolvedOptions(this.resolver, config);
      panel.addEventListener('panel-close', () => ref.close());
      panel.addEventListener('filter-apply', event => {
        const detail = (event as CustomEvent<FilterDrawerResult | Record<string, unknown>>).detail;
        if (isFilterDrawerResult(detail)) {
          this.query.write({ ...detail.state, page: 1 }, config);
          ref.close({ applied: true, state: { ...detail.state, page: 1 }, params: toFilterParams({ ...detail.state, page: 1 }, config) });
          return;
        }
        ref.close();
      });
      return panel;
    }, { dismissible: true });
  }
}
const isFilterDrawerResult = (value: unknown): value is FilterDrawerResult => typeof value === 'object' && value != null && 'state' in value && 'params' in value;
const awaitableResolvedOptions = (resolver: FilterResolverAdapter | undefined, config: ModuleFilterConfigModel): Promise<Record<string, FilterOptionModel[]> | undefined> => Promise.resolve(resolver?.resolve(config) as Promise<Record<string, FilterOptionModel[]> | undefined> | Record<string, FilterOptionModel[]> | undefined);
export class FilterDrawerComponent extends MiscElement {
  initial: Record<string, unknown> | null = null;
  config: ModuleFilterConfigModel | null = null;
  heading = 'Filters';
  state: FilterStateModel = emptyFilterState();
  optionLists: Promise<Record<string, FilterOptionModel[]> | undefined> | Record<string, FilterOptionModel[]> | undefined = undefined;
  #draft: FilterStateModel = emptyFilterState();
  #selectedKeys = new Set<string>();
  #loadedOptionLists: Record<string, FilterOptionModel[]> = {};
  apply(state: FilterStateModel = this.#draft): void {
    if (!this.config) {
      this.dispatchEvent(new CustomEvent('filter-apply', { bubbles: true, composed: true, detail: this.initial ?? {} }));
      return;
    }
    this.dispatchEvent(new CustomEvent('filter-apply', { bubbles: true, composed: true, detail: { applied: true, state, params: toFilterParams(state, this.config) } satisfies FilterDrawerResult }));
  }
  connectedCallback(): void {
    this.#draft = cloneFilterState(this.state);
    this.#selectedKeys = new Set(Object.keys(this.#draft.values).filter(key => this.#draft.values[key]));
    const optionLists = this.optionLists;
    if (optionLists && typeof (optionLists as Promise<unknown>).then === 'function') {
      void (optionLists as Promise<Record<string, FilterOptionModel[]> | undefined>).then((value) => { this.#loadedOptionLists = value ?? {}; this.render(); });
    } else {
      this.#loadedOptionLists = (optionLists as Record<string, FilterOptionModel[]> | undefined) ?? {};
    }
    super.connectedCallback();
  }
  protected render(): void {
    if (!this.config) {
      this.html('<section aria-label="Filters"><slot></slot><div part="actions"><button type="button" data-action="clear">Clear</button><button type="button" data-action="apply">Apply</button></div></section>');
      this.root?.querySelector('[data-action="clear"]')?.addEventListener('click', () => { this.initial = {}; this.apply(); });
      this.root?.querySelector('[data-action="apply"]')?.addEventListener('click', () => this.apply());
      return;
    }
    const search = this.config.search ? `<div part="field"><label for="filter-search">${esc(this.config.search.label)}</label><input id="filter-search" data-bind="search" value="${esc(this.#draft.search ?? '')}" placeholder="${esc(this.config.search.placeholder ?? '')}"></div>` : '';
    const date = this.config.date ? `<section part="group"><div part="group-head"><strong>Date</strong><button type="button" data-action="clear-date">Clear</button></div><label for="filter-date-field">Field</label><select id="filter-date-field" data-bind="date">${['<option value=""></option>', ...(this.config.date.fields ?? []).map((option: FilterOptionModel) => `<option value="${esc(option.value)}"${this.#draft.date === option.value ? ' selected' : ''}>${esc(option.label)}</option>`)].join('')}</select><div part="inline-grid"><div><label for="filter-from">From</label><input id="filter-from" type="date" data-bind="from" value="${esc(this.#draft.from ?? '')}" max="${esc(this.#draft.to ?? '')}"></div><div><label for="filter-to">To</label><input id="filter-to" type="date" data-bind="to" value="${esc(this.#draft.to ?? '')}" min="${esc(this.#draft.from ?? '')}"></div></div></section>` : '';
    const sort = this.config.sort ? `<div part="field"><label for="filter-sort">Sort</label><select id="filter-sort" data-bind="order">${(this.config.sort.options ?? []).map((option: FilterOptionModel) => `<option value="${esc(option.value)}"${this.#draft.order === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}</select></div>` : '';
    const filterBy = this.config.fields.length ? `<fieldset part="group"><legend>Filter by</legend><div part="checkbox-list">${this.config.fields.map((field: FilterFieldModel) => `<label part="checkbox"><input type="checkbox" data-filter-key="${esc(field.key)}"${this.#selectedKeys.has(field.key) ? ' checked' : ''}> <span>${esc(field.label)}</span></label>`).join('')}</div></fieldset>` : '';
    const fieldMarkup = [...this.#selectedKeys].map((key) => {
      const field = this.config?.fields.find((item: FilterFieldModel) => item.key === key);
      if (!field) return '';
      return `<section part="group"><div part="group-head"><strong>${esc(field.label)}</strong><button type="button" data-action="clear-field" data-key="${esc(field.key)}">Clear</button></div>${renderFieldControl(field, this.#draft, this.#loadedOptionLists[field.key])}</section>`;
    }).join('');
    this.html(`<section aria-label="Filters"><style>
      section[aria-label="Filters"]{display:flex;min-height:100%;flex-direction:column}
      [part="header"]{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;padding:1.5rem 1.5rem 1rem;border-bottom:1px solid var(--africanies-border,#d8dde7)}
      [part="body"]{display:flex;min-height:0;flex:1;flex-direction:column;gap:1rem;overflow:auto;padding:1.25rem 1.5rem}
      [part="field"],[part="group"]{display:flex;flex-direction:column;gap:.5rem}
      [part="group"]{padding-top:1rem;border-top:1px solid var(--africanies-border,#d8dde7)}
      [part="group-head"]{display:flex;align-items:center;justify-content:space-between;gap:.75rem}
      [part="checkbox-list"]{display:grid;gap:.5rem}
      [part="checkbox"]{display:flex;align-items:center;gap:.5rem;font-weight:400;margin:0}
      [part="checkbox"] input{width:auto}
      [part="inline-grid"]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}
      [part="enum-list"]{display:flex;flex-wrap:wrap;gap:.5rem}
      [part="enum-option"][data-selected="true"]{border-color:var(--africanies-export,#1cbd5d);background:rgba(28,189,93,.08);color:var(--africanies-export,#1cbd5d);font-weight:600}
      [part="footer"]{display:flex;gap:.75rem;padding:1rem 1.5rem;border-top:1px solid var(--africanies-border,#d8dde7);background:var(--africanies-surface,#fff)}
      [part="footer"] button{flex:1}
      @media (max-width:640px){[part="inline-grid"]{grid-template-columns:1fr}}
    </style><div part="header"><div><p style="margin:0 0 .25rem;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--africanies-muted,#667085)">Filters</p><h2 style="margin:0;font-size:1.25rem">${esc(this.heading)}</h2></div><button type="button" data-action="close" part="dismiss" aria-label="Close">×</button></div><div part="body">${search}${date}${sort}${filterBy}${fieldMarkup}</div><div part="footer actions"><button type="button" data-action="reset">Reset</button><button type="button" data-action="apply">Apply</button></div></section>`);
    this.root?.querySelector('[data-action="close"]')?.addEventListener('click', () => this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true })));
    this.root?.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      this.#draft = resetFilterState(false, this.#draft);
      this.#selectedKeys.clear();
      this.render();
    });
    this.root?.querySelector('[data-action="clear-date"]')?.addEventListener('click', () => {
      this.#draft = { ...this.#draft, date: undefined, from: undefined, to: undefined };
      this.render();
    });
    this.root?.querySelectorAll<HTMLInputElement>('[data-bind="search"],[data-bind="from"],[data-bind="to"]').forEach((input) => input.addEventListener('input', () => {
      const key = input.dataset.bind as 'search' | 'from' | 'to';
      this.#draft = { ...this.#draft, [key]: input.value || undefined };
      if (key === 'from' && this.#draft.to && input.value && this.#draft.to < input.value) this.#draft.to = undefined;
      if (key === 'to' && this.#draft.from && input.value && this.#draft.from > input.value) this.#draft.from = undefined;
    }));
    this.root?.querySelectorAll<HTMLSelectElement>('[data-bind="date"],[data-bind="order"]').forEach((select) => select.addEventListener('change', () => {
      const key = select.dataset.bind as 'date' | 'order';
      this.#draft = { ...this.#draft, [key]: select.value || undefined };
    }));
    this.root?.querySelectorAll<HTMLInputElement>('[data-filter-key]').forEach((input) => input.addEventListener('change', () => {
      const key = input.dataset.filterKey;
      if (!key) return;
      if (input.checked) this.#selectedKeys.add(key);
      else {
        this.#selectedKeys.delete(key);
        const nextValues = { ...this.#draft.values };
        delete nextValues[key];
        this.#draft = { ...this.#draft, values: nextValues };
      }
      this.render();
    }));
    this.root?.querySelectorAll<HTMLElement>('[data-action="clear-field"]').forEach((button) => button.addEventListener('click', () => {
      const key = button.getAttribute('data-key');
      if (!key) return;
      const nextValues = { ...this.#draft.values };
      delete nextValues[key];
      this.#draft = { ...this.#draft, values: nextValues };
      this.render();
    }));
    this.root?.querySelectorAll<HTMLInputElement>('[data-field-text]').forEach((input) => input.addEventListener('input', () => {
      const key = input.dataset.fieldText;
      if (!key) return;
      this.#draft = { ...this.#draft, values: { ...this.#draft.values, [key]: input.value || undefined } };
    }));
    this.root?.querySelectorAll<HTMLButtonElement>('[data-field-enum]').forEach((button) => button.addEventListener('click', () => {
      const key = button.dataset.fieldEnum;
      const value = button.dataset.value;
      if (!key || !value) return;
      this.#draft = { ...this.#draft, values: { ...this.#draft.values, [key]: value } };
      this.render();
    }));
    this.root?.querySelectorAll<HTMLSelectElement>('[data-field-select]').forEach((select) => select.addEventListener('change', () => {
      const key = select.dataset.fieldSelect;
      if (!key) return;
      this.#draft = { ...this.#draft, values: { ...this.#draft.values, [key]: select.value || undefined } };
    }));
    this.root?.querySelector('[data-action="apply"]')?.addEventListener('click', () => this.apply({ ...this.#draft, values: { ...this.#draft.values } }));
  }
}
const renderFieldControl = (field: FilterFieldModel, state: FilterStateModel, loaded?: FilterOptionModel[]): string => {
  const value = state.values[field.key] ?? '';
  if (field.type === 'text') return `<input data-field-text="${esc(field.key)}" value="${esc(value)}" placeholder="${esc(field.placeholder ?? '')}">`;
  const options = loaded ?? field.options ?? [];
  if (field.type === 'enum') return `<div part="enum-list">${options.map((option: FilterOptionModel) => `<button type="button" part="enum-option" data-field-enum="${esc(field.key)}" data-value="${esc(option.value)}" data-selected="${String(value === option.value)}">${esc(option.label)}</button>`).join('')}</div>`;
  return `<select data-field-select="${esc(field.key)}"><option value="">${esc(field.placeholder ?? 'Select…')}</option>${options.map((option: FilterOptionModel) => `<option value="${esc(option.value)}"${value === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}</select>`;
};
export class FilterDrawerPanel extends FilterDrawerComponent { reset(): void { this.initial = {}; this.state = emptyFilterState(); this.apply(); } close(): void { this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true })); } }

export const AFRICANIES_MISC_ELEMENTS = Object.freeze({ 'africanies-action-menu': ActionMenuComponent, 'africanies-action-menu-trigger': ActionMenuTriggerComponent, 'africanies-avatar': AvatarComponent, 'africanies-avatar-menu': AvatarMenuComponent, 'africanies-brand-logo': BrandLogoComponent, 'africanies-image': ImageComponent, 'africanies-image-fallback-frame': ImageFallbackFrameComponent, 'africanies-carrier-logo': CarrierLogoComponent, 'africanies-tooltip': TooltipComponent, 'africanies-info-popover': InfoPopoverComponent, 'africanies-app-shell': AppShellComponent, 'africanies-app-shell-header': AppShellHeaderComponent, 'africanies-app-shell-content-header': AppShellContentHeaderComponent, 'africanies-header': HeaderComponent, 'africanies-content-header': ContentHeaderComponent, 'africanies-notification-drawer': NotificationDrawerPanel, 'africanies-filter-drawer': FilterDrawerPanel });
