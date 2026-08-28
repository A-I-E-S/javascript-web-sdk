# HTTP, authentication, shipping mode, and storage

## HTTP

`ApiClient` is Fetch-based. Configure `baseUrl`; inject `fetch` for tests or runtimes without it. It supports GET/POST/PUT/PATCH/DELETE, middleware, query arrays, headers, `AbortSignal`, owned timeouts, normalization/raw responses, and optional TTL GET caching. Empty query values are omitted; native bodies such as `FormData` are not forced to JSON.

Retry behavior is narrow: one retry for retryable GET failures; writes are never retried automatically. `ApiError` carries status, details, and response.

```js
const cache = new HttpResponseCache({ defaultTtlMs: 10_000 });
const api = new ApiClient({ baseUrl: 'https://api.example.com', cache });
await api.get('/countries', { query: { perPage: 15 }, cache: true });
```

## Authentication

`AuthTokenService` persists bearer tokens under `africanies.accessToken` using local storage by default. Configure it as the client's `authToken` reader. Clearing the token clears an attached response cache. Storage does not protect against XSS; never log or inject tokens into HTML.

## Shipping mode

`ShippingModeService` accepts `sfn` (default) and `stn`, stores state per tab under `africanies.shippingMode`, validates corrupt values, supports an async change guard, subscriptions, and cache clearing. `ApiClient` sends `x-shipment-mode`; request overrides do not mutate tab state.

## Storage

`LocalStorageService` and `SessionStorageService` implement JSON `get`, `set`, `remove`, and `clear`. Inject a Web Storage-compatible object for tests/restricted contexts. Stable keys are `africanies.theme`, `africanies.accessToken`, `africanies.modeConfig`, and `africanies.shippingMode`. Serialization, parsing, quota, and security errors remain visible to callers.
