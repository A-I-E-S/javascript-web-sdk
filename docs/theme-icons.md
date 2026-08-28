# Theme and icons

## Theme

`ThemeService` receives document and storage capabilities, resolves a stored light/dark preference or `prefers-color-scheme`, then applies the root `dark` class and `color-scheme`. `setTheme`, `toggle`, and `subscribe` are synchronous. Call unsubscribe and `destroy()` at the host lifecycle boundary. Persistence failure does not roll back the visible state.

`ModeColorService`, `MODE_COLOR_CLASSES`, and `MODE_COLOR_SAFELIST` preserve SFN export-green and STN import-orange tokens. Standalone package CSS is primary; there is no Tailwind runtime requirement.

## Icons

The icons package exports 641 reference names, a generated sprite, `IconRegistryService`, `AfricaniesIconComponent`, and explicit registration. The registry deduplicates concurrent loads and injects one hidden sprite.

```js
defineAfricaniesIcon({ customElements, HTMLElement, document, spriteUrl: '/assets/icons.sprite.svg' });
```

Use `<africanies-icon name="check"></africanies-icon>` with an exported name. Host sprites from a trusted same-origin or CORS-enabled immutable URL and configure CSP appropriately. Imports never fetch or touch the DOM.
