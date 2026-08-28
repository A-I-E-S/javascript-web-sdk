# AFRICANIES JavaScript Web SDK

Framework-independent browser SDK translating the intended public behavior of the [AFRICANIES Angular Web SDK](https://github.com/A-I-E-S/angular-web-sdk) into TypeScript-authored JavaScript without Angular or RxJS.

> Pre-release parity recovery: the Vanilla implementation is being revalidated against the canonical Angular source and playground. Passing local contract tests does not by itself establish complete visual or behavioral parity. Browser evidence, parity review, and owner approval are required before publication. Consult the [Project Context parity matrix](https://github.com/A-I-E-S/javascript-web-sdk-context).

## Packages

- `@africanies/africanies-models`
- `@africanies/africanies-storage`
- `@africanies/africanies-core`
- `@africanies/africanies-theme`
- `@africanies/africanies-icons`
- `@africanies/africanies-ui`
- `@africanies/javascript-web-sdk`

## Quick start

```sh
npm install @africanies/javascript-web-sdk
```

```js
import { createAfricaniesSdk, defineAfricaniesElements } from '@africanies/javascript-web-sdk';

const sdk = createAfricaniesSdk({ baseUrl: 'https://api.example.com' });
defineAfricaniesElements({
  customElements,
  document,
  HTMLElement,
  iconSpriteUrl: '/assets/africanies-icons/icons.sprite.svg'
});

await sdk.apiClient.get('/countries');
```

## Playground and docs

- [Repository playground source](examples/playground/index.html)
- [Canonical Angular playground](https://a-i-e-s.github.io/angular-web-sdk/)
- [Packages and public API](docs/packages.md)
- [Installation and quick start](docs/getting-started.md)
- [HTTP, authentication, shipping mode, and storage](docs/core-guides.md)
- [Theme and icons](docs/theme-icons.md)
- [UI, overlays, and toasts](docs/ui.md)
- [CDN, integrity, and caching](docs/cdn.md)
- [Browser compatibility](docs/browser-compatibility.md)
- [Angular migration](docs/angular-migration.md)
- [Security](SECURITY.md), [contributing](CONTRIBUTING.md), [releasing](docs/releasing.md), and [changelog](CHANGELOG.md)

For repository verification:

```sh
npm install
npm run check
```

The coordinated candidate package version is `0.1.0`. It is not a statement that this version has been published; use only a version confirmed by the npm registry when installing from npm or a CDN.

## Contributors

Ikechukwu, Chinedu, Armstrong, Adebowale, Muhydeen, Dotun, and Busola.

Licensed under the [MIT License](LICENSE).
