/** Public entry point for framework-independent theme controllers and tokens. */
export const THEME_PACKAGE_NAME = '@africanies/africanies-theme';

export type Theme = 'light' | 'dark';
type ShippingMode = 'sfn' | 'stn';
export type Unsubscribe = () => void;

export interface ThemeStorage {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
}
export interface ThemeDocument {
  readonly documentElement: { readonly classList: Pick<DOMTokenList, 'add' | 'remove'>; readonly style: { colorScheme: string } };
  readonly defaultView?: { matchMedia?(query: string): Pick<MediaQueryList, 'matches'> } | null;
}
export interface ThemeServiceOptions { document: ThemeDocument; storage: ThemeStorage; storageKey?: string }
const AFRICANIES_THEME_KEY = 'africanies.theme';

/** Synchronous theme state with explicitly injected browser capabilities. */
export class ThemeService {
  readonly #document: ThemeDocument;
  readonly #storage: ThemeStorage;
  readonly #storageKey: string;
  readonly #listeners = new Set<(theme: Theme) => void>();
  #theme: Theme;
  constructor(options: ThemeServiceOptions) {
    this.#document = options.document;
    this.#storage = options.storage;
    this.#storageKey = options.storageKey ?? AFRICANIES_THEME_KEY;
    this.#theme = this.#resolveInitialTheme();
    this.#applyToDocument(this.#theme);
  }
  getTheme(): Theme { return this.#theme; }
  setTheme(theme: Theme): void {
    if (theme !== 'light' && theme !== 'dark') throw new TypeError(`Unsupported theme: ${String(theme)}`);
    const changed = theme !== this.#theme;
    this.#theme = theme;
    this.#applyToDocument(theme);
    try { this.#storage.set(this.#storageKey, theme); } catch {}
    if (changed) for (const listener of [...this.#listeners]) listener(theme);
  }
  toggle(): Theme { const next = this.#theme === 'light' ? 'dark' : 'light'; this.setTheme(next); return next; }
  subscribe(listener: (theme: Theme) => void): Unsubscribe { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; }
  destroy(): void { this.#listeners.clear(); }
  #resolveInitialTheme(): Theme {
    try { const stored = this.#storage.get<Theme>(this.#storageKey); if (stored === 'light' || stored === 'dark') return stored; } catch {}
    return this.#document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  #applyToDocument(theme: Theme): void {
    if (theme === 'dark') this.#document.documentElement.classList.add('dark'); else this.#document.documentElement.classList.remove('dark');
    this.#document.documentElement.style.colorScheme = theme;
  }
}

export interface ModeColorClasses { text: string; bg: string; bgSubtle: string; border: string; primary: string; ghostPrimary: string; soft: string; softSolid: string; softHover: string }
const freezeModeColors = (classes: ModeColorClasses): Readonly<ModeColorClasses> => Object.freeze(classes);
export const MODE_COLOR_CLASSES = Object.freeze({
  sfn: freezeModeColors({
    text: 'text-export',
    bg: 'bg-export',
    bgSubtle: 'bg-export-subtle',
    border: 'border-export',
    primary: 'bg-export text-white border-transparent hover:bg-export-light',
    ghostPrimary: 'bg-transparent text-export border-transparent hover:bg-export-subtle dark:hover:bg-export/15',
    soft: 'bg-export-subtle dark:bg-export/15',
    softSolid: 'bg-export-subtle dark:bg-[color-mix(in_srgb,#1cbd5d_15%,#212529)]',
    softHover: 'hover:bg-export-subtle dark:hover:bg-export/15'
  }),
  stn: freezeModeColors({
    text: 'text-import',
    bg: 'bg-import',
    bgSubtle: 'bg-import-subtle',
    border: 'border-import',
    primary: 'bg-import text-white border-transparent hover:bg-import-light',
    ghostPrimary: 'bg-transparent text-import border-transparent hover:bg-import-subtle dark:hover:bg-import/15',
    soft: 'bg-import-subtle dark:bg-import/15',
    softSolid: 'bg-import-subtle dark:bg-[color-mix(in_srgb,#f08829_15%,#212529)]',
    softHover: 'hover:bg-import-subtle dark:hover:bg-import/15'
  })
} as const);
export const MODE_COLOR_SAFELIST = Object.freeze([
  'text-export', 'bg-export', 'bg-export-subtle', 'bg-export-light', 'border-export', 'hover:bg-export-light', 'hover:bg-export-subtle', 'dark:bg-export/15', 'dark:hover:bg-export/15', 'dark:bg-[color-mix(in_srgb,#1cbd5d_15%,#212529)]',
  'text-import', 'bg-import', 'bg-import-subtle', 'bg-import-light', 'border-import', 'hover:bg-import-light', 'hover:bg-import-subtle', 'dark:bg-import/15', 'dark:hover:bg-import/15', 'dark:bg-[color-mix(in_srgb,#f08829_15%,#212529)]'
] as const);
export interface ShippingModeSource { getMode(): ShippingMode; subscribe?(listener: (mode: ShippingMode) => void): Unsubscribe }
export class ModeColorService {
  readonly #listeners = new Set<(classes: Readonly<ModeColorClasses>) => void>();
  #unsubscribeSource?: Unsubscribe;
  constructor(readonly source: ShippingModeSource) { this.#unsubscribeSource = source.subscribe?.(() => { const classes = this.getClasses(); for (const listener of [...this.#listeners]) listener(classes); }); }
  getClasses(): Readonly<ModeColorClasses> { return MODE_COLOR_CLASSES[this.source.getMode()]; }
  subscribe(listener: (classes: Readonly<ModeColorClasses>) => void): Unsubscribe { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; }
  destroy(): void { this.#unsubscribeSource?.(); this.#unsubscribeSource = undefined; this.#listeners.clear(); }
}

export interface ShippingModeDocument {
  readonly documentElement: { readonly dataset: DOMStringMap };
}

/** Mirrors shipping-mode state onto the DOM for mode-aware CSS and custom elements. */
export function bindShippingModeToDocument(source: ShippingModeSource, target: ShippingModeDocument): Unsubscribe {
  const apply = (mode: ShippingMode): void => { target.documentElement.dataset.africaniesMode = mode; };
  apply(source.getMode());
  const unsubscribe = source.subscribe?.(apply) ?? (() => undefined);
  return () => { unsubscribe(); delete target.documentElement.dataset.africaniesMode; };
}
