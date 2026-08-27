# Angular migration and parity

The Angular SDK is the behavioral reference; Angular runtime concepts are translated honestly.

| Angular | Vanilla JavaScript |
| --- | --- |
| Providers/DI | Constructors and `createAfricaniesSdk()` |
| Signals/Observables | Getters and lightweight `subscribe()`; service calls use Promises |
| HTTP interceptors | Ordered `ApiClient` middleware |
| Components/input/output | Custom elements, attributes/properties, and `CustomEvent`s |
| Projection/templates | Slots, DOM nodes, and render callbacks |
| Router/CDK | Host URL/history adapter and owned overlays |
| `ControlValueAccessor` | Native value/events and form-associated elements where supported |
| NgModules | No equivalent; explicit one-time element registration |

Consumers own unsubscribe/destroy/close lifecycle calls. See the [Project Context parity matrix](https://github.com/A-I-E-S/javascript-web-sdk-context) for status and gaps.
