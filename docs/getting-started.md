# Installation and quick start

This project is pre-release; example `VERSION` placeholders are not published coordinates.

```sh
npm install @africanies/javascript-web-sdk
```

```js
import { createAfricaniesSdk, defineAfricaniesElements } from '@africanies/javascript-web-sdk';

const sdk = createAfricaniesSdk({ baseUrl: 'https://api.example.com' });
defineAfricaniesElements({ customElements, HTMLElement });
const countries = await sdk.apiClient.get('/countries');
```

Registration is explicit and idempotent; importing packages does not mutate the DOM. CDN consumers can use a self-contained ESM bundle or the browser-global `globalThis.Africanies` namespace without a bundler. See [CDN usage](cdn.md).
