/** Public entry point for icon metadata, registry and custom element. */
export const ICONS_PACKAGE_NAME = '@africanies/africanies-icons';
export { ICON_NAMES } from './icon-name.js';
export type { IconName } from './icon-name.js';

import type { IconName } from './icon-name.js';

export const AFRICANIES_ICON_SPRITE_URL = '/assets/africanies-icons/icons.sprite.svg';
export const AFRICANIES_ICON_SPRITE_CONTAINER_ID = 'africanies-icon-sprite';

interface SpriteResponse { readonly ok: boolean; readonly status?: number; text(): Promise<string> }
export interface IconDocument {
  readonly body: { prepend(node: IconContainer): void };
  createElement(tagName: string): IconContainer;
  getElementById(id: string): unknown | null;
}
export interface IconContainer {
  id: string;
  innerHTML: string;
  setAttribute(name: string, value: string): void;
}
export interface IconRegistryOptions {
  document: IconDocument;
  fetch?: (url: string) => Promise<SpriteResponse>;
  spriteUrl?: string;
}

/** Fetches and inlines the trusted package sprite once; concurrent calls share work. */
export class IconRegistryService {
  readonly #document: IconDocument;
  readonly #fetch: (url: string) => Promise<SpriteResponse>;
  readonly #spriteUrl: string;
  #loadPromise: Promise<void> | null = null;
  #loaded = false;
  constructor(options: IconRegistryOptions) {
    this.#document = options.document;
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (!fetchImplementation) throw new TypeError('IconRegistryService requires fetch support or an injected fetch implementation');
    this.#fetch = (url) => fetchImplementation(url) as Promise<SpriteResponse>;
    this.#spriteUrl = options.spriteUrl ?? AFRICANIES_ICON_SPRITE_URL;
  }
  ensureLoaded(): Promise<void> {
    if (this.#loaded) return Promise.resolve();
    if (this.#loadPromise) return this.#loadPromise;
    this.#loadPromise = this.#fetchAndInline().finally(() => { this.#loadPromise = null; });
    return this.#loadPromise;
  }
  isLoaded(): boolean { return this.#loaded; }
  async #fetchAndInline(): Promise<void> {
    if (this.#document.getElementById(AFRICANIES_ICON_SPRITE_CONTAINER_ID)) { this.#loaded = true; return; }
    const response = await this.#fetch(this.#spriteUrl);
    if (!response.ok) throw new Error(`Failed to load AFRICANIES icon sprite from "${this.#spriteUrl}" (${response.status ?? 'unknown'})`);
    const container = this.#document.createElement('div');
    container.id = AFRICANIES_ICON_SPRITE_CONTAINER_ID;
    container.setAttribute('hidden', '');
    container.setAttribute('aria-hidden', 'true');
    container.innerHTML = await response.text();
    this.#document.body.prepend(container);
    this.#loaded = true;
  }
}

export interface IconHost {
  innerHTML: string;
  setAttribute(name: string, value: string): void;
}
export interface AfricaniesIconOptions { name: IconName; size?: number | string }

/** DOM renderer shared by the custom element registration adapter. */
export class AfricaniesIconComponent {
  constructor(readonly host: IconHost, readonly registry: IconRegistryService) {}
  render(options: AfricaniesIconOptions): void {
    const size = String(options.size ?? 24);
    this.host.setAttribute('data-icon', options.name);
    this.host.innerHTML = `<svg width="${escapeAttribute(size)}" height="${escapeAttribute(size)}" aria-hidden="true" focusable="false" part="svg"><use href="#${escapeAttribute(options.name)}"></use></svg>`;
    void this.registry.ensureLoaded().catch((error: unknown) => { console.error('[africanies-icon] sprite load failed', error); });
  }
}

const escapeAttribute = (value: string): string => value.replace(/[&"<>]/g, (character) => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[character] ?? character);

export interface DefineAfricaniesIconOptions extends IconRegistryOptions {
  customElements: Pick<CustomElementRegistry, 'define' | 'get'>;
  HTMLElement: typeof HTMLElement;
  tagName?: string;
}

/** Explicit, idempotent registration; importing this package never touches the DOM. */
export function defineAfricaniesIcon(options: DefineAfricaniesIconOptions): CustomElementConstructor {
  const tagName = options.tagName ?? 'africanies-icon';
  const existing = options.customElements.get(tagName);
  if (existing) return existing;
  const registry = new IconRegistryService(options);
  const ElementBase = options.HTMLElement;
  class AfricaniesIconElement extends ElementBase {
    static get observedAttributes(): string[] { return ['name', 'size']; }
    connectedCallback(): void { this.#render(); }
    attributeChangedCallback(): void { if (this.isConnected) this.#render(); }
    #render(): void {
      const name = this.getAttribute('name');
      if (!name) return;
      new AfricaniesIconComponent(this, registry).render({ name: name as IconName, size: this.getAttribute('size') ?? 24 });
    }
  }
  options.customElements.define(tagName, AfricaniesIconElement);
  return AfricaniesIconElement;
}
