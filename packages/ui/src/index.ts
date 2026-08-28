/** Public entry point for AFRICANIES custom elements and UI services. */
import type { ToastItem, ToastService } from './toast.js';
import { AFRICANIES_FORM_ELEMENTS } from './forms.js';
import { AFRICANIES_NAVIGATION_DATA_ELEMENTS } from './navigation-data.js';
import { AFRICANIES_MISC_ELEMENTS } from './misc.js';
import { AFRICANIES_EXTERNAL_ELEMENTS } from './external.js';
import { ConfirmDialogComponent } from './overlay.js';
import { withAfricaniesShadowStyles } from './styles.js';

export * from './forms.js';
export * from './navigation-data.js';
export * from './misc.js';
export * from './external.js';
export * from './overlay.js';
export * from './toast.js';
export * from './styles.js';
export * from './translations.js';

export const UI_PACKAGE_NAME = '@africanies/africanies-ui';

export interface CustomElementRegistryLike {
  define(name: string, constructor: CustomElementConstructor): void;
  get(name: string): CustomElementConstructor | undefined;
}

type HTMLElementConstructor = typeof HTMLElement;
const HTMLElementBase: HTMLElementConstructor = (globalThis.HTMLElement ?? class {}) as HTMLElementConstructor;
const escapeHtml = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const booleanAttribute = (element: Element, name: string): boolean => typeof element.hasAttribute === 'function' && element.hasAttribute(name);

abstract class AfricaniesElement extends HTMLElementBase {
  protected renderRoot: ShadowRoot | null = null;
  connectedCallback(): void {
    if (!this.renderRoot && typeof this.attachShadow === 'function') this.renderRoot = this.attachShadow({ mode: 'open' });
    this.render();
  }
  attributeChangedCallback(): void { this.render(); }
  protected abstract render(): void;
  protected setMarkup(markup: string): void { if (this.renderRoot) this.renderRoot.innerHTML = withAfricaniesShadowStyles(markup); }
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ghost-primary' | 'ghost-danger' | 'underline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export class ButtonComponent extends AfricaniesElement {
  static readonly observedAttributes = ['disabled', 'loading', 'type', 'variant', 'size', 'aria-label'];
  #button: HTMLButtonElement | null = null;
  #click = (event: Event): void => {
    if (this.disabled || this.loading) { event.preventDefault(); event.stopPropagation(); return; }
  };
  get disabled(): boolean { return booleanAttribute(this, 'disabled'); }
  set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
  get loading(): boolean { return booleanAttribute(this, 'loading'); }
  set loading(value: boolean) { this.toggleAttribute('loading', value); }
  disconnectedCallback(): void { this.#unbind(); }
  protected render(): void {
    this.#unbind();
    const disabled = this.disabled || this.loading;
    const type = this.getAttribute('type') === 'submit' ? 'submit' : 'button';
    const variant = this.getAttribute('variant') ?? 'primary';
    const size = this.getAttribute('size') ?? 'md';
    const label = this.getAttribute('aria-label');
    this.setMarkup(`<button part="button" type="${type}" data-variant="${escapeHtml(variant)}" data-size="${escapeHtml(size)}"${disabled ? ' disabled aria-disabled="true"' : ''}${label ? ` aria-label="${escapeHtml(label)}"` : ''}><span part="spinner"${this.loading ? '' : ' hidden'} aria-hidden="true"></span><slot></slot></button>`);
    this.#button = this.renderRoot?.querySelector('button') ?? null;
    this.#button?.addEventListener('click', this.#click);
  }
  #unbind(): void { this.#button?.removeEventListener('click', this.#click); this.#button = null; }
}

export class CopyButtonComponent extends AfricaniesElement {
  static readonly observedAttributes = ['value', 'label', 'copied-label', 'disabled', 'aria-label', 'aria-label-text', 'button-class', 'size', 'feedback-ms', 'announce'];
  clipboard: Pick<Clipboard, 'writeText'> | null = null;
  #button: HTMLButtonElement | null = null;
  #copied = false;
  #timer: ReturnType<typeof globalThis.setTimeout> | null = null;
  #click = (): void => { void this.copy(); };
  async copy(): Promise<boolean> {
    if (booleanAttribute(this, 'disabled')) return false;
    const clipboard = this.clipboard ?? globalThis.navigator?.clipboard ?? null;
    try {
      if (!clipboard) throw new Error('Clipboard API is unavailable.');
      const value = this.getAttribute('value') ?? this.textContent ?? '';
      await clipboard.writeText(value);
      this.#copied = true;
      if (this.#timer !== null) globalThis.clearTimeout(this.#timer);
      const feedbackMs = Number(this.getAttribute('feedback-ms') ?? 1600);
      this.#timer = globalThis.setTimeout(() => { this.#copied = false; this.#timer = null; this.render(); }, Number.isFinite(feedbackMs) ? feedbackMs : 1600);
      this.render();
      this.dispatchEvent(new CustomEvent('copied', { bubbles: true, composed: true, detail: value }));
      this.dispatchEvent(new CustomEvent('copy-success', { bubbles: true, composed: true, detail: value }));
      return true;
    } catch (error) {
      if (typeof globalThis.CustomEvent === 'function' && typeof this.dispatchEvent === 'function') {
        this.dispatchEvent(new CustomEvent('failed', { bubbles: true, composed: true }));
        this.dispatchEvent(new CustomEvent('copy-error', { bubbles: true, composed: true, detail: error }));
      }
      return false;
    }
  }
  disconnectedCallback(): void { this.#unbind(); if (this.#timer !== null) globalThis.clearTimeout(this.#timer); this.#timer = null; }
  protected render(): void {
    this.#unbind();
    const disabled = booleanAttribute(this, 'disabled');
    const visibleLabel = this.getAttribute('label');
    const copiedLabel = this.getAttribute('copied-label') ?? 'Copied';
    const label = this.#copied ? 'Copied' : (this.getAttribute('aria-label-text') ?? this.getAttribute('aria-label') ?? visibleLabel ?? 'Copy to clipboard');
    const size = this.getAttribute('size') ?? 'sm';
    this.setMarkup(`<button part="button" type="button" data-size="${escapeHtml(size)}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${disabled ? ' disabled aria-disabled="true"' : ''}><span part="icon" aria-hidden="true">${this.#copied ? '✓' : '⧉'}</span>${visibleLabel ? `<span part="label">${escapeHtml(this.#copied ? copiedLabel : visibleLabel)}</span>` : ''}<slot></slot></button><span role="status" aria-live="polite" part="status">${this.#copied ? 'Copied' : ''}</span>`);
    this.#button = this.renderRoot?.querySelector('button') ?? null;
    this.#button?.addEventListener('click', this.#click);
  }
  #unbind(): void { this.#button?.removeEventListener('click', this.#click); this.#button = null; }
}
/** Backward-compatible constructor for the former non-canonical tag name. */
export class LegacyCopyButtonComponent extends CopyButtonComponent {}

abstract class MessageComponent extends AfricaniesElement {
  static readonly observedAttributes = ['heading', 'message'];
  protected abstract readonly messageRole: 'status' | 'alert';
  protected abstract readonly defaultHeading: string;
  protected render(): void {
    const heading = this.getAttribute('heading') ?? this.defaultHeading;
    const message = this.getAttribute('message') ?? '';
    this.setMarkup(`<section part="container" role="${this.messageRole}"${this.messageRole === 'status' ? ' aria-live="polite"' : ''}><strong part="heading">${escapeHtml(heading)}</strong>${message ? `<p part="message">${escapeHtml(message)}</p>` : ''}<slot></slot></section>`);
  }
}
export class LoadingComponent extends MessageComponent { protected readonly messageRole = 'status'; protected readonly defaultHeading = 'Loading'; }
export class EmptyComponent extends MessageComponent { protected readonly messageRole = 'status'; protected readonly defaultHeading = 'No results'; }
export class ErrorComponent extends MessageComponent { protected readonly messageRole = 'alert'; protected readonly defaultHeading = 'Something went wrong'; }
export type LoadingStateMode = 'spinner' | 'skeleton';
export const LoadingStateComponent = LoadingComponent;
export const EmptyStateComponent = EmptyComponent;
export const ErrorStateComponent = ErrorComponent;

export type AsyncState = 'idle' | 'loading' | 'empty' | 'error' | 'success';
export interface AsyncQueryStateLike<T = unknown> { data: T | undefined; isLoading: boolean; isFetching: boolean; isError: boolean; error: string | null; }
export type AsyncView = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'empty' } | { kind: 'content'; staleError: boolean; fetching: boolean };
export function resolveAsyncView<T>(state: AsyncQueryStateLike<T>): AsyncView {
  if (state.isLoading) return { kind: 'loading' };
  if (state.isError && state.data === undefined) return { kind: 'error', message: state.error ?? 'Something went wrong.' };
  if (state.data == null || (Array.isArray(state.data) && state.data.length === 0)) return { kind: 'empty' };
  return { kind: 'content', staleError: state.isError, fetching: state.isFetching };
}
export class AsyncStateComponent<T = unknown> extends AfricaniesElement {
  static readonly observedAttributes = ['state', 'message'];
  #state: AsyncQueryStateLike<T> | null = null;
  get state(): AsyncQueryStateLike<T> | null { return this.#state; }
  set state(value: AsyncQueryStateLike<T> | null) { this.#state = value; this.render(); }
  protected render(): void {
    const legacy = this.getAttribute('state') as AsyncState | null;
    const view = this.#state ? resolveAsyncView(this.#state) : ({ kind: legacy === 'success' || legacy === 'idle' ? 'content' : legacy ?? 'content', staleError: false, fetching: false } as AsyncView);
    const role = view.kind === 'error' ? 'alert' : 'status';
    const label = this.getAttribute('message') ?? (view.kind === 'loading' ? 'Loading…' : view.kind === 'empty' ? 'No results found.' : view.kind === 'error' ? view.message : '');
    const stale = view.kind === 'content' && view.staleError ? `<div part="stale-error" role="alert">${escapeHtml(this.#state?.error?.trim() || 'Failed to fetch the most recent data.')}<button type="button" part="retry">Refresh</button></div>` : '';
    this.setMarkup(`<div part="${view.kind}" role="${role}"${role === 'status' ? ' aria-live="polite"' : ''} data-state="${view.kind}"${view.kind === 'content' && view.fetching ? ' aria-busy="true"' : ''}>${stale}${escapeHtml(label)}<slot name="${view.kind}"></slot>${view.kind === 'content' ? '<slot></slot>' : ''}</div>`);
    this.renderRoot?.querySelector('[part="retry"]')?.addEventListener('click', () => this.dispatchEvent(new CustomEvent('retry', { bubbles: true, composed: true })));
  }
}

export class ErrorIndicatorComponent extends AfricaniesElement {
  static readonly observedAttributes = ['message'];
  protected render(): void { this.setMarkup(`<span part="indicator" role="alert"><span aria-hidden="true">!</span><span>${escapeHtml(this.getAttribute('message') ?? 'Error')}</span></span>`); }
}

export type AccordionSize = 'sm' | 'md';
export class AccordionComponent extends AfricaniesElement {
  static readonly observedAttributes = ['heading', 'open', 'size', 'disabled'];
  #toggle = (): void => { if (!this.hasAttribute('disabled')) { this.toggleAttribute('open'); this.dispatchEvent(new CustomEvent('open-change', { bubbles: true, composed: true, detail: { open: this.hasAttribute('open') } })); } };
  protected render(): void {
    const open = this.hasAttribute('open');
    const id = this.id ? `${this.id}-panel` : 'accordion-panel';
    this.setMarkup(`<section part="accordion" data-size="${escapeHtml(this.getAttribute('size') ?? 'md')}"><h3><button part="trigger" type="button" aria-expanded="${open}" aria-controls="${escapeHtml(id)}"${this.hasAttribute('disabled') ? ' disabled' : ''}>${escapeHtml(this.getAttribute('heading') ?? '')}</button></h3><div part="panel" id="${escapeHtml(id)}"${open ? '' : ' hidden'}><slot></slot></div></section>`);
    this.renderRoot?.querySelector('button')?.addEventListener('click', this.#toggle);
  }
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
/** @deprecated Use AlertVariant. */
export type AlertTone = AlertVariant | 'error';
export class AlertComponent extends AfricaniesElement {
  static readonly observedAttributes = ['variant', 'title', 'message', 'dismissible', 'icon', 'tone', 'heading'];
  #dismiss: HTMLButtonElement | null = null;
  #onDismiss = (): void => { this.dispatchEvent(new CustomEvent('dismissed', { bubbles: true, composed: true })); this.dispatchEvent(new CustomEvent('alert-dismiss', { bubbles: true, composed: true })); };
  disconnectedCallback(): void { this.#unbind(); }
  protected render(): void {
    this.#unbind();
    const variant = (this.getAttribute('variant') ?? this.getAttribute('tone') ?? 'info').replace('error', 'danger');
    const role = variant === 'danger' || variant === 'warning' ? 'alert' : 'status';
    const heading = this.getAttribute('title') ?? this.getAttribute('heading');
    const message = this.getAttribute('message') ?? '';
    const dismissible = !this.hasAttribute('dismissible') || this.getAttribute('dismissible') !== 'false';
    this.setMarkup(`<section part="alert" data-variant="${escapeHtml(variant)}" role="${role}" aria-live="${role === 'alert' ? 'assertive' : 'polite'}">${heading ? `<strong part="heading">${escapeHtml(heading)}</strong>` : ''}<div part="content">${escapeHtml(message)}<slot></slot></div>${dismissible ? '<button part="dismiss" type="button" aria-label="Dismiss">×</button>' : ''}</section>`);
    this.#dismiss = this.renderRoot?.querySelector('[part="dismiss"]') ?? null;
    this.#dismiss?.addEventListener('click', this.#onDismiss);
  }
  #unbind(): void { this.#dismiss?.removeEventListener('click', this.#onDismiss); this.#dismiss = null; }
}

export class ChipComponent extends AfricaniesElement {
  static readonly observedAttributes = ['variant', 'size', 'icon', 'removable', 'remove-label', 'tone', 'aria-label'];
  #remove: HTMLButtonElement | null = null;
  #onRemove = (event: Event): void => { event.stopPropagation(); this.dispatchEvent(new CustomEvent('removed', { bubbles: true, composed: true })); this.dispatchEvent(new CustomEvent('chip-remove', { bubbles: true, composed: true })); };
  disconnectedCallback(): void { this.#unbind(); }
  protected render(): void {
    this.#unbind();
    const variant = this.getAttribute('variant') ?? this.getAttribute('tone') ?? 'neutral';
    const size = this.getAttribute('size') ?? 'sm';
    const label = this.getAttribute('remove-label') ?? this.getAttribute('aria-label') ?? 'Remove';
    const icon = this.getAttribute('icon');
    this.setMarkup(`<span part="chip" role="status" data-variant="${escapeHtml(variant)}" data-size="${escapeHtml(size)}">${icon ? `<africanies-icon name="${escapeHtml(icon)}" size="${size === 'md' ? '14' : '12'}"></africanies-icon>` : ''}<slot></slot>${booleanAttribute(this, 'removable') ? `<button part="remove" type="button" aria-label="${escapeHtml(label)}">×</button>` : ''}</span>`);
    this.#remove = this.renderRoot?.querySelector('[part="remove"]') ?? null;
    this.#remove?.addEventListener('click', this.#onRemove);
  }
  #unbind(): void { this.#remove?.removeEventListener('click', this.#onRemove); this.#remove = null; }
}

export class ContentStackComponent extends AfricaniesElement {
  static readonly observedAttributes = ['gap', 'align'];
  protected render(): void { this.setMarkup(`<div part="stack" data-gap="${escapeHtml(this.getAttribute('gap') ?? 'medium')}" data-align="${escapeHtml(this.getAttribute('align') ?? 'stretch')}"><slot></slot></div>`); }
}

export class ToastItemComponent extends AfricaniesElement {
  #item: ToastItem | null = null;
  #dismiss: HTMLButtonElement | null = null;
  #pause = (): void => this.emit('toast-pause');
  #resume = (): void => this.emit('toast-resume');
  #close = (): void => this.emit('toast-dismiss-one');
  #dismissAll = (): void => this.emit('toast-dismiss-all');
  #expand = (): void => this.emit('toast-expand');
  #collapse = (): void => this.emit('toast-collapse');
  set item(value: ToastItem | null) { this.#item = value; this.render(); }
  get item(): ToastItem | null { return this.#item; }
  connectedCallback(): void { super.connectedCallback(); this.addEventListener('mouseenter', this.#pause); this.addEventListener('mouseleave', this.#resume); this.addEventListener('focusin', this.#pause); this.addEventListener('focusout', this.#resume); }
  disconnectedCallback(): void { this.removeEventListener('mouseenter', this.#pause); this.removeEventListener('mouseleave', this.#resume); this.removeEventListener('focusin', this.#pause); this.removeEventListener('focusout', this.#resume); this.#unbind(); }
  protected render(): void {
    this.#unbind(); const item = this.#item; if (!item) { this.setMarkup(''); return; }
    const role = item.variant === 'warning' || item.variant === 'danger' ? 'alert' : 'status';
    const live = role === 'alert' ? 'assertive' : 'polite';
    const copies = item.expanded && item.count > 1 ? Array.from({ length: item.count }, (_, index) => `<article part="toast" data-variant="${item.variant}"${index === 0 ? ` role="${role}" aria-live="${live}"` : ''}>${item.title ? `<strong part="title">${escapeHtml(item.title)}</strong>` : ''}<p part="message">${escapeHtml(item.message)}</p><button part="dismiss" type="button" aria-label="Dismiss">×</button></article>`).join('') : `<article part="toast" data-variant="${item.variant}" role="${role}" aria-live="${live}">${item.title ? `<strong part="title">${escapeHtml(item.title)}</strong>` : ''}<p part="message">${escapeHtml(item.message)}</p>${item.count > 1 ? `<span part="count" aria-label="${item.count} identical notifications">×${item.count}</span>` : ''}<button part="dismiss" type="button" aria-label="${item.count > 1 ? 'Dismiss outermost' : 'Dismiss'}">×</button></article>`;
    const actions = item.count > 1 ? `<div part="stack-actions"><button part="toggle-stack" type="button">${item.expanded ? 'Collapse' : 'Expand'}</button><button part="dismiss-all" type="button">Close all</button></div>` : '';
    this.setMarkup(`${copies}${actions}`);
    this.#dismiss = this.renderRoot?.querySelector('[part="dismiss"]') ?? null;
    this.renderRoot?.querySelectorAll('[part="dismiss"]').forEach(button => button.addEventListener('click', this.#close));
    this.renderRoot?.querySelector('[part="dismiss-all"]')?.addEventListener('click', this.#dismissAll);
    this.renderRoot?.querySelector('[part="toggle-stack"]')?.addEventListener('click', item.expanded ? this.#collapse : this.#expand);
  }
  private emit(name: string): void { if (typeof globalThis.CustomEvent === 'function') this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { id: this.#item?.id } })); }
  #unbind(): void { this.#dismiss?.removeEventListener('click', this.#close); this.#dismiss = null; }
}

export class ToastHostComponent extends AfricaniesElement {
  #service: ToastService | null = null;
  #unsubscribe: (() => void) | null = null;
  #items: readonly ToastItem[] = [];
  #event = (event: Event): void => { const detail = (event as CustomEvent<{ id?: string }>).detail; if (!detail?.id || !this.#service) return; if (event.type === 'toast-dismiss-one') this.#service.dismissOne(detail.id); else if (event.type === 'toast-dismiss-all') this.#service.dismiss(detail.id); else if (event.type === 'toast-expand') this.#service.expand(detail.id); else if (event.type === 'toast-collapse') this.#service.collapse(detail.id); else if (event.type === 'toast-pause') this.#service.pause(detail.id); else this.#service.resume(detail.id); };
  set service(value: ToastService | null) { this.#unsubscribe?.(); this.#service = value; this.#unsubscribe = value?.subscribe(items => { this.#items = items; this.render(); }) ?? null; }
  get service(): ToastService | null { return this.#service; }
  connectedCallback(): void { super.connectedCallback(); for (const name of ['toast-dismiss-one', 'toast-dismiss-all', 'toast-expand', 'toast-collapse', 'toast-pause', 'toast-resume']) this.addEventListener(name, this.#event); }
  disconnectedCallback(): void { for (const name of ['toast-dismiss-one', 'toast-dismiss-all', 'toast-expand', 'toast-collapse', 'toast-pause', 'toast-resume']) this.removeEventListener(name, this.#event); this.#unsubscribe?.(); this.#unsubscribe = null; }
  protected render(): void {
    const actions = this.#service?.showHostActions ? `<div part="host-actions">${this.#service.hasStacks ? `<button part="toggle-all" type="button">${this.#service.allStacksExpanded ? 'Collapse all' : 'Expand all'}</button>` : ''}<button part="close-all" type="button">Close all</button></div>` : '';
    this.setMarkup(`<section part="host" role="region" aria-label="Notifications">${actions}<div part="items"></div></section>`);
    this.renderRoot?.querySelector('[part="toggle-all"]')?.addEventListener('click', () => this.#service?.allStacksExpanded ? this.#service.collapseAll() : this.#service?.expandAll());
    this.renderRoot?.querySelector('[part="close-all"]')?.addEventListener('click', () => this.#service?.clear());
    const container = this.renderRoot?.querySelector('[part="items"]'); if (!container) return;
    for (const item of this.#items) { const element = container.ownerDocument.createElement('africanies-toast-item') as ToastItemComponent; element.item = item; container.append(element); }
  }
}

export class OverlayFrameComponent extends AfricaniesElement {
  protected render(): void { this.setMarkup('<div part="header"><slot name="header"></slot></div><div part="body" class="africanies-overlay-scroll"><slot></slot></div><div part="footer"><slot name="footer"></slot></div>'); }
}

export const AFRICANIES_UI_ELEMENTS = Object.freeze({
  ...AFRICANIES_FORM_ELEMENTS,
  ...AFRICANIES_NAVIGATION_DATA_ELEMENTS,
  ...AFRICANIES_MISC_ELEMENTS,
  ...AFRICANIES_EXTERNAL_ELEMENTS,
  'africanies-button': ButtonComponent,
  'africanies-copy': CopyButtonComponent,
  'africanies-copy-button': LegacyCopyButtonComponent,
  'africanies-loading': LoadingComponent,
  'africanies-empty': EmptyComponent,
  'africanies-error': ErrorComponent,
  'africanies-async-state': AsyncStateComponent,
  'africanies-error-indicator': ErrorIndicatorComponent,
  'africanies-accordion': AccordionComponent,
  'africanies-alert': AlertComponent,
  'africanies-chip': ChipComponent,
  'africanies-content-stack': ContentStackComponent,
  'africanies-toast-item': ToastItemComponent,
  'africanies-toast-host': ToastHostComponent,
  'africanies-overlay-frame': OverlayFrameComponent,
  'africanies-confirm-dialog': ConfirmDialogComponent
});
export type AfricaniesUiElementName = keyof typeof AFRICANIES_UI_ELEMENTS;

/** Register all UI elements once. Imports remain side-effect and DOM-global free. */
export function defineAfricaniesElements(registry: CustomElementRegistryLike | undefined = globalThis.customElements): readonly AfricaniesUiElementName[] {
  if (!registry) return [];
  const defined: AfricaniesUiElementName[] = [];
  for (const [name, constructor] of Object.entries(AFRICANIES_UI_ELEMENTS) as [AfricaniesUiElementName, CustomElementConstructor][]) {
    if (!registry.get(name)) { registry.define(name, constructor); defined.push(name); }
  }
  return defined;
}
