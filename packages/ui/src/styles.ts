/**
 * Default component styles injected into every AFRICANIES shadow root.
 *
 * The documented theme/Tailwind CSS import owns design tokens on `:root`.
 * Custom properties cross the shadow boundary; ordinary utility selectors do
 * not, so this complete baseline is intentionally colocated with the elements.
 */
export const AFRICANIES_SHADOW_STYLES = `
:host{box-sizing:border-box;color:var(--africanies-ink,#172033);font-family:var(--africanies-font-sans,Inter,ui-sans-serif,system-ui,sans-serif)}
:host([hidden]){display:none!important}*,*::before,*::after{box-sizing:inherit}
button,input,textarea,select{font:inherit}button,a,input,textarea,select{outline-offset:2px}
button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid var(--africanies-focus,#172033)}
button{border:1px solid var(--africanies-border,#d8dde7);border-radius:.375rem;background:var(--africanies-surface,#fff);color:inherit;cursor:pointer;min-height:2.5rem;padding:0 .875rem}
button:hover:not(:disabled){background:var(--africanies-surface-hover,#f5f7fa)}button:disabled,[aria-disabled="true"]{cursor:not-allowed;opacity:.5}
[part="button"][data-variant="primary"]{background:var(--africanies-mode-primary,var(--africanies-export,#1cbd5d));border-color:transparent;color:#fff}
:host-context([data-africanies-mode="stn"]) [part="button"][data-variant="primary"]{--africanies-mode-primary:var(--africanies-import,#f08829)}
[part="button"][data-variant="danger"]{background:var(--africanies-danger,#dc2626);border-color:transparent;color:#fff}
[part="button"][data-variant="ghost"],[part="button"][data-variant="ghost-primary"],[part="button"][data-variant="ghost-danger"],[part="button"][data-variant="underline"]{background:transparent;border-color:transparent}
[part="button"][data-variant="ghost-primary"]{color:var(--africanies-mode-primary,var(--africanies-export,#1cbd5d))}[part="button"][data-variant="ghost-danger"]{color:var(--africanies-danger,#dc2626)}[part="button"][data-variant="underline"]{text-decoration:underline;padding-inline:0}
[data-size="sm"]{min-height:2rem;padding-inline:.625rem;font-size:.875rem}[data-size="lg"]{min-height:3rem;padding-inline:1rem;font-size:1.125rem}
label{display:block;font-size:.875rem;font-weight:500;margin-bottom:.375rem}input,textarea,select{width:100%;border:1px solid var(--africanies-border,#d8dde7);border-radius:.375rem;background:var(--africanies-surface,#fff);color:inherit;padding:.625rem .75rem}input[aria-invalid="true"],textarea[aria-invalid="true"],select[aria-invalid="true"]{border-color:var(--africanies-danger,#dc2626)}
[part="error"]{color:var(--africanies-danger,#dc2626);font-size:.75rem;margin-top:.25rem}[role="alert"],[role="status"]{line-height:1.5}
[part="alert"],[part="toast"]{display:flex;gap:.75rem;border:1px solid var(--africanies-border,#d8dde7);border-radius:.5rem;background:var(--africanies-surface,#fff);padding:.75rem 1rem}[data-variant="danger"]{--africanies-accent:var(--africanies-danger,#dc2626)}[data-variant="warning"]{--africanies-accent:var(--africanies-warning,#ca8a04)}[data-variant="success"]{--africanies-accent:var(--africanies-export,#1cbd5d)}
[part="chip"]{display:inline-flex;align-items:center;gap:.25rem;border-radius:.375rem;background:var(--africanies-surface-muted,#eef1f5);padding:.125rem .5rem;font-size:.75rem;font-weight:600}[part="chip"][data-size="md"]{padding:.25rem .625rem;font-size:.875rem}
table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid var(--africanies-border,#d8dde7);padding:.75rem;text-align:left}nav ul,nav ol{list-style:none;margin:0;padding:0}[role="tablist"]{display:flex;gap:.25rem}
[data-sort]{min-height:0;padding:0;border:0;border-radius:0;background:transparent}[data-sort]:hover:not(:disabled){background:transparent;text-decoration:underline}
[part="actions"]{display:flex;align-items:center;justify-content:flex-end;gap:.75rem}
[part="dismiss"]{width:2rem;height:2rem;min-height:0;padding:0;border-color:transparent;border-radius:999px;background:transparent;font-size:1.25rem;line-height:1}
[part="mode-heading"]{margin:0 0 .5rem;padding:0 .25rem;color:var(--africanies-muted,#667085);font-size:.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase}
[part="mode-options"]{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.375rem}[part="mode-options"][data-collapsed="true"]{grid-template-columns:1fr}
[part="mode-card"]{display:flex;width:100%;min-height:4.5rem;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;padding:.5rem .375rem;border-radius:.5rem;font-size:.75rem;font-weight:500;line-height:1.25;text-align:center;transition:background-color .15s,border-color .15s,color .15s}
[part="mode-options"][data-collapsed="true"] [part="mode-card"]{min-height:2.25rem;padding:.375rem .25rem}[part="mode-glyph"]{width:1.5rem;height:1.5rem;flex:none}[part="mode-glyph"][data-direction="stn"]{transform:rotate(180deg)}[part="mode-label"]{display:flex;flex-direction:column}
[part="mode-card"][data-mode="stn"][data-selected="true"]{border-color:var(--africanies-import,#f08829);background:var(--africanies-import,#f08829);color:#fff}[part="mode-card"][data-mode="sfn"][data-selected="true"]{border-color:var(--africanies-export,#1cbd5d);background:var(--africanies-export,#1cbd5d);color:#fff}
:host-context(html.dark) [part="mode-card"][data-selected="false"]{border-color:rgba(255,255,255,.15);background:var(--africanies-surface-dark,#101827);color:#fff}
[part="host"]{display:block;max-height:calc(100dvh - 2rem);overflow:auto}[part="items"]{display:flex;flex-direction:column;gap:.5rem}[part="host-actions"],[part="stack-actions"]{display:flex;justify-content:flex-end;gap:.5rem}
:host-context(.dark){color:var(--africanies-ink-dark,#fff)}:host-context(.dark) button,:host-context(.dark) input,:host-context(.dark) textarea,:host-context(.dark) select,:host-context(.dark) [part="alert"],:host-context(.dark) [part="toast"]{background:var(--africanies-surface-dark,#101827);border-color:rgba(255,255,255,.15);color:#fff}
@media (prefers-reduced-motion:no-preference){[part="spinner"]:not([hidden]){display:inline-block;animation:africanies-spin .8s linear infinite}}@keyframes africanies-spin{to{transform:rotate(360deg)}}
`;

export const withAfricaniesShadowStyles = (markup: string): string =>
  `<style data-africanies-defaults>${AFRICANIES_SHADOW_STYLES}</style>${markup}`;
