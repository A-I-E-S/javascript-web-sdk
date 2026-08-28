/** Public entry point for AFRICANIES custom elements and UI services. */
import type { ToastItem, ToastService } from './toast.js';
import { AFRICANIES_FORM_ELEMENTS } from './forms.js';
import { AFRICANIES_NAVIGATION_DATA_ELEMENTS } from './navigation-data.js';
import { AFRICANIES_MISC_ELEMENTS } from './misc.js';
import { AFRICANIES_EXTERNAL_ELEMENTS } from './external.js';

export * from './forms.js';
export * from './navigation-data.js';
export * from './misc.js';
export * from './external.js';
export * from './overlay.js';
export * from './toast.js';

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
  protected setMarkup(markup: string): void { if (this.renderRoot) this.renderRoot.innerHTML = markup; }
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

export class ButtonComponent extends AfricaniesElement {
  static readonly observedAttributes = ['disabled', 'loading', 'type', 'variant', 'size', 'aria-label'];
  #button: HTMLButtonElement | null = null;
  #click = (event: Event): void => {
    if (this.disabled || this.loading) { event.preventDefault(); event.stopPropagation(); return; }
    this.dispatchEvent(new CustomEvent('africanies-click', { bubbles: true, composed: true }));
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
    const size = this.getAttribute('size') ?? 'medium';
    const label = this.getAttribute('aria-label');
    this.setMarkup(`<button part="button" type="${type}" data-variant="${escapeHtml(variant)}" data-size="${escapeHtml(size)}"${disabled ? ' disabled aria-disabled="true"' : ''}${label ? ` aria-label="${escapeHtml(label)}"` : ''}><span part="spinner"${this.loading ? '' : ' hidden'} aria-hidden="true"></span><slot></slot></button>`);
    this.#button = this.renderRoot?.querySelector('button') ?? null;
    this.#button?.addEventListener('click', this.#click);
  }
  #unbind(): void { this.#button?.removeEventListener('click', this.#click); this.#button = null; }
}

export class CopyButtonComponent extends AfricaniesElement {
  static readonly observedAttributes = ['value', 'disabled', 'aria-label'];
  clipboard: Pick<Clipboard, 'writeText'> | null = null;
  #button: HTMLButtonElement | null = null;
  #click = (): void => { void this.copy(); };
  async copy(): Promise<boolean> {
    if (booleanAttribute(this, 'disabled')) return false;
    const clipboard = this.clipboard ?? globalThis.navigator?.clipboard ?? null;
    try {
      if (!clipboard) throw new Error('Clipboard API is unavailable.');
      await clipboard.writeText(this.getAttribute('value') ?? this.textContent ?? '');
      this.dispatchEvent(new CustomEvent('copy-success', { bubbles: true, composed: true }));
      return true;
    } catch (error) {
      if (typeof globalThis.CustomEvent === 'function' && typeof this.dispatchEvent === 'function') this.dispatchEvent(new CustomEvent('copy-error', { bubbles: true, composed: true, detail: error }));
      return false;
    }
  }
  disconnectedCallback(): void { this.#unbind(); }
  protected render(): void {
    this.#unbind();
    const disabled = booleanAttribute(this, 'disabled');
    const label = this.getAttribute('aria-label') ?? 'Copy to clipboard';
    this.setMarkup(`<button part="button" type="button" aria-label="${escapeHtml(label)}"${disabled ? ' disabled aria-disabled="true"' : ''}><slot>Copy</slot></button><span role="status" aria-live="polite" part="status"></span>`);
    this.#button = this.renderRoot?.querySelector('button') ?? null;
    this.#button?.addEventListener('click', this.#click);
  }
  #unbind(): void { this.#button?.removeEventListener('click', this.#click); this.#button = null; }
}

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

export type AsyncState = 'idle' | 'loading' | 'empty' | 'error' | 'success';
export class AsyncStateComponent extends AfricaniesElement {
  static readonly observedAttributes = ['state', 'message'];
  get state(): AsyncState { const value = this.getAttribute('state'); return value === 'loading' || value === 'empty' || value === 'error' || value === 'success' ? value : 'idle'; }
  set state(value: AsyncState) { this.setAttribute('state', value); }
  protected render(): void {
    const state = this.state;
    const role = state === 'error' ? 'alert' : 'status';
    const label = this.getAttribute('message') ?? ({ loading: 'Loading', empty: 'No results', error: 'Something went wrong', success: '', idle: '' }[state]);
    this.setMarkup(`<div part="${state}" role="${role}"${role === 'status' ? ' aria-live="polite"' : ''} data-state="${state}">${escapeHtml(label)}<slot name="${state}"></slot>${state === 'success' ? '<slot></slot>' : ''}</div>`);
  }
}

export class ErrorIndicatorComponent extends AfricaniesElement {
  static readonly observedAttributes = ['message'];
  protected render(): void { this.setMarkup(`<span part="indicator" role="alert"><span aria-hidden="true">!</span><span>${escapeHtml(this.getAttribute('message') ?? 'Error')}</span></span>`); }
}

export type AlertTone = 'info' | 'success' | 'warning' | 'error';
export class AlertComponent extends AfricaniesElement {
  static readonly observedAttributes = ['tone', 'heading', 'dismissible'];
  #dismiss: HTMLButtonElement | null = null;
  #onDismiss = (): void => { this.dispatchEvent(new CustomEvent('alert-dismiss', { bubbles: true, composed: true })); this.hidden = true; };
  disconnectedCallback(): void { this.#unbind(); }
  protected render(): void {
    this.#unbind();
    const tone = this.getAttribute('tone') ?? 'info';
    const role = tone === 'error' || tone === 'warning' ? 'alert' : 'status';
    const heading = this.getAttribute('heading');
    this.setMarkup(`<section part="alert" data-tone="${escapeHtml(tone)}" role="${role}">${heading ? `<strong part="heading">${escapeHtml(heading)}</strong>` : ''}<div part="content"><slot></slot></div>${booleanAttribute(this, 'dismissible') ? '<button part="dismiss" type="button" aria-label="Dismiss alert">×</button>' : ''}</section>`);
    this.#dismiss = this.renderRoot?.querySelector('[part="dismiss"]') ?? null;
    this.#dismiss?.addEventListener('click', this.#onDismiss);
  }
  #unbind(): void { this.#dismiss?.removeEventListener('click', this.#onDismiss); this.#dismiss = null; }
}

export class ChipComponent extends AfricaniesElement {
  static readonly observedAttributes = ['tone', 'removable', 'aria-label'];
  #remove: HTMLButtonElement | null = null;
  #onRemove = (): void => { this.dispatchEvent(new CustomEvent('chip-remove', { bubbles: true, composed: true })); };
  disconnectedCallback(): void { this.#unbind(); }
  protected render(): void {
    this.#unbind();
    const tone = this.getAttribute('tone') ?? 'neutral';
    const label = this.getAttribute('aria-label') ?? 'Remove';
    this.setMarkup(`<span part="chip" data-tone="${escapeHtml(tone)}"><slot></slot>${booleanAttribute(this, 'removable') ? `<button part="remove" type="button" aria-label="${escapeHtml(label)}">×</button>` : ''}</span>`);
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
  set item(value: ToastItem | null) { this.#item = value; this.render(); }
  get item(): ToastItem | null { return this.#item; }
  connectedCallback(): void { super.connectedCallback(); this.addEventListener('mouseenter', this.#pause); this.addEventListener('mouseleave', this.#resume); this.addEventListener('focusin', this.#pause); this.addEventListener('focusout', this.#resume); }
  disconnectedCallback(): void { this.removeEventListener('mouseenter', this.#pause); this.removeEventListener('mouseleave', this.#resume); this.removeEventListener('focusin', this.#pause); this.removeEventListener('focusout', this.#resume); this.#unbind(); }
  protected render(): void {
    this.#unbind(); const item = this.#item; if (!item) { this.setMarkup(''); return; }
    const role = item.variant === 'warning' || item.variant === 'danger' ? 'alert' : 'status';
    const live = role === 'alert' ? 'assertive' : 'polite';
    this.setMarkup(`<article part="toast" data-variant="${item.variant}" role="${role}" aria-live="${live}">${item.title ? `<strong part="title">${escapeHtml(item.title)}</strong>` : ''}<p part="message">${escapeHtml(item.message)}</p>${item.count > 1 ? `<span part="count" aria-label="${item.count} identical notifications">×${item.count}</span>` : ''}<button part="dismiss" type="button" aria-label="${item.count > 1 ? 'Dismiss outermost' : 'Dismiss'}">×</button></article>`);
    this.#dismiss = this.renderRoot?.querySelector('[part="dismiss"]') ?? null; this.#dismiss?.addEventListener('click', this.#close);
  }
  private emit(name: string): void { if (typeof globalThis.CustomEvent === 'function') this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail: { id: this.#item?.id } })); }
  #unbind(): void { this.#dismiss?.removeEventListener('click', this.#close); this.#dismiss = null; }
}

export class ToastHostComponent extends AfricaniesElement {
  #service: ToastService | null = null;
  #unsubscribe: (() => void) | null = null;
  #items: readonly ToastItem[] = [];
  #event = (event: Event): void => { const detail = (event as CustomEvent<{ id?: string }>).detail; if (!detail?.id || !this.#service) return; if (event.type === 'toast-dismiss-one') this.#service.dismissOne(detail.id); else if (event.type === 'toast-pause') this.#service.pause(detail.id); else this.#service.resume(detail.id); };
  set service(value: ToastService | null) { this.#unsubscribe?.(); this.#service = value; this.#unsubscribe = value?.subscribe(items => { this.#items = items; this.render(); }) ?? null; }
  get service(): ToastService | null { return this.#service; }
  connectedCallback(): void { super.connectedCallback(); for (const name of ['toast-dismiss-one', 'toast-pause', 'toast-resume']) this.addEventListener(name, this.#event); }
  disconnectedCallback(): void { for (const name of ['toast-dismiss-one', 'toast-pause', 'toast-resume']) this.removeEventListener(name, this.#event); this.#unsubscribe?.(); this.#unsubscribe = null; }
  protected render(): void {
    this.setMarkup(`<section part="host" aria-label="Notifications"><div part="items"></div></section>`);
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
  'africanies-copy-button': CopyButtonComponent,
  'africanies-loading': LoadingComponent,
  'africanies-empty': EmptyComponent,
  'africanies-error': ErrorComponent,
  'africanies-async-state': AsyncStateComponent,
  'africanies-error-indicator': ErrorIndicatorComponent,
  'africanies-alert': AlertComponent,
  'africanies-chip': ChipComponent,
  'africanies-content-stack': ContentStackComponent,
  'africanies-toast-item': ToastItemComponent,
  'africanies-toast-host': ToastHostComponent,
  'africanies-overlay-frame': OverlayFrameComponent
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
