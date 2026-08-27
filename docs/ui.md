# UI catalog, overlays, and toasts

## Registration and contracts

`defineAfricaniesElements({ customElements, HTMLElement })` explicitly and idempotently registers the complete 50+ element catalog. Importing the package does not register elements or touch the DOM.

Structured inputs use properties, scalar configuration uses attributes, and outputs use bubbling composed `CustomEvent`s. Forms use form-associated behavior when `ElementInternals` is supported. Disconnect callbacks release owned listeners/subscriptions.

## Catalog map

- Actions and feedback: button, copy button, action menu/trigger, loading, empty, error, async state, error indicator, alert, and chip.
- Forms: text, textarea, number, date, checkbox, radio, toggle, OTP, select, search combobox, and the select-create workflow (`SelectCreateConfig`) with modal and fallback semantics.
- Identity and content: avatar, avatar menu, brand/carrier logos, image fallback frame, and content stack.
- Help and layout: tooltip, info popover, app shell, header, content header, and page header.
- Navigation and data: breadcrumb, tabs, segment, shipping-mode switch, side navigation, table, pagination, and stepper. Router coupling is replaced by links, route helpers, and host adapters.
- Notifications and filters: notification drawer/service, filter drawer/service, query synchronization, and option-resolver adapter.
- External browser capabilities: Google Places-backed address input, file upload, file preview dialog, and camera capture dialog with owned stream cleanup. Places requires an explicitly configured API key/fetch implementation; camera/file APIs remain browser permission and capability dependent.
- Feedback and overlays: toast item/host/service, overlay frame/ref, confirm, modal, and drawer services.

Angular-only directives, providers, content definitions, router injection, and CDK overlays are represented by constructors, element properties, named slots, callbacks, custom events, History adapters, and owned overlay services. See [Angular migration](angular-migration.md) for the contract differences and [Project Context](https://github.com/A-I-E-S/javascript-web-sdk-context) for source-level mapping.

## Overlays

`ModalService` and `DrawerService` return an `OverlayRef`. Behavior covers backdrop/Escape close, focus containment/return, scroll locking, and one-time result resolution. Call `close(result)` or destroy the owning service. Angular CDK portals are replaced by DOM/callback contracts; `RouteOverlayService` uses a host URL/history adapter.

## Toasts

Attach a `ToastService` to an `<africanies-toast-host>` through its `service` property. Identical messages stack by fingerprint/count; timers pause on hover/focus and are cleared by `destroy()`. Warning/danger use assertive announcements. Toasts are feedback, not durable logs.
