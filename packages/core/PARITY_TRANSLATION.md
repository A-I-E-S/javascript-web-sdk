# Angular parity translation

Angular DI tokens and functional interceptors are framework integration
mechanisms, not product-domain runtime objects. Vanilla translates their
observable behavior into explicit `ApiClient` configuration, middleware,
`RequestOptions`, storage-backed services, and overlay route adapters. The
`ANGULAR_ONLY_CORE_EXPORTS` register records the omitted Angular-only names.

Erased interfaces remain TypeScript interfaces or aliases. Runtime helpers,
mappers, service names, endpoint constants, list-fetch state selection, and CSV
behavior preserve their canonical names wherever consumers can observe them.
