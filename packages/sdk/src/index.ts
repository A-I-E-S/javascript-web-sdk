export * from '@africanies/africanies-models';
export * from '@africanies/africanies-storage';
export * from '@africanies/africanies-core';
export * from '@africanies/africanies-theme';
export * from '@africanies/africanies-icons';
export * from '@africanies/africanies-ui';

import { AFRICANIES_ICON_SPRITE_URL, defineAfricaniesIcon, type IconDocument } from '@africanies/africanies-icons';
import { defineAfricaniesElements as defineUiElements, type AfricaniesUiElementName } from '@africanies/africanies-ui';

export interface DefineAfricaniesElementsOptions {
  /** @deprecated Use customElements. If both are provided, registry takes precedence. */
  registry?: CustomElementRegistry;
  customElements?: CustomElementRegistry;
  document?: Document;
  HTMLElement?: typeof globalThis.HTMLElement;
  fetch?: typeof globalThis.fetch;
  iconSpriteUrl?: string;
}

/**
 * Registers the complete SDK element catalog, including the icon element used
 * internally by buttons, chips, alerts and toast surfaces.
 */
export function defineAfricaniesElements(options: DefineAfricaniesElementsOptions = {}): readonly AfricaniesUiElementName[] {
  const registry = options.registry ?? options.customElements ?? globalThis.customElements;
  const document = options.document ?? globalThis.document;
  const ElementBase = options.HTMLElement ?? globalThis.HTMLElement;
  const defined = defineUiElements(registry);
  if (registry && document?.body && ElementBase) {
    defineAfricaniesIcon({
      customElements: registry,
      document: document as unknown as IconDocument,
      HTMLElement: ElementBase,
      fetch: options.fetch,
      spriteUrl: options.iconSpriteUrl ?? AFRICANIES_ICON_SPRITE_URL
    });
  }
  return defined;
}

declare const __AFRICANIES_SDK_VERSION__: string | undefined;

/** Package version; browser bundles may override it through the reproducible build input. */
export const VERSION = typeof __AFRICANIES_SDK_VERSION__ === 'string'
  ? __AFRICANIES_SDK_VERSION__
  : '0.1.0';
