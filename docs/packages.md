# Packages and public API

All packages are ESM-first and safe to import without browser globals.

| Package | Implemented surface |
| --- | --- |
| `@africanies/africanies-models` | Domain contracts, constants, delivery-vendor helpers, and filter serializers |
| `@africanies/africanies-storage` | `StorageService`, local/session adapters, factories, and stable keys |
| `@africanies/africanies-core` | `ApiClient`, `ApiError`, `HttpResponseCache`, auth/shipping state, SDK factory, domain services, mappers, filter/route adapters, and browser utilities |
| `@africanies/africanies-theme` | `ThemeService`, `ModeColorService`, class maps/safelist, and standalone CSS |
| `@africanies/africanies-icons` | `ICON_NAMES`, sprite, `IconRegistryService`, renderer, and custom-element registration |
| `@africanies/africanies-ui` | 50+ explicit custom elements spanning actions, feedback, forms, identity, help, layout, navigation, data, notifications, filters, address/file/camera flows, overlays and toasts; associated services and adapters |
| `@africanies/javascript-web-sdk` | Umbrella re-exports and self-contained CDN bundles |

Use domain imports for the smallest graph or the umbrella for convenience. Export maps are the machine-readable authority. Symbol-level completion and honest framework differences belong in [Project Context](https://github.com/A-I-E-S/javascript-web-sdk-context).
