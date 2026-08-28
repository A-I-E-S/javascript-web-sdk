import { withAfricaniesShadowStyles } from './styles.js';

type HTMLElementConstructor = typeof HTMLElement;
const HTMLElementBase: HTMLElementConstructor = (globalThis.HTMLElement ?? class {}) as HTMLElementConstructor;
const html = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
let controlSequence = 0;

export interface SelectOption<T = string> { label: string; value: T; disabled?: boolean; }
export interface SelectCreateConfig<TResult = unknown, T = string> { label: string; component: Node | ((context: { data: unknown; ref: unknown; document: Document }) => Node); data?: unknown; mapResult: (result: TResult) => SelectOption<T>; }
export interface SelectModalAdapter { open<TData, TResult>(component: Node | ((context: { data: TData | undefined; ref: unknown; document: Document }) => Node), config: { data?: TData }): { closed: Promise<TResult | undefined> }; }

abstract class FormControlElement extends HTMLElementBase {
  static readonly formAssociated = true;
  static readonly observedAttributes = ['value', 'name', 'label', 'placeholder', 'disabled', 'required', 'error'];
  protected root: ShadowRoot | null = null;
  protected control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;
  protected internals: ElementInternals | null = null;
  protected controlId = `africanies-control-${++controlSequence}`;
  #value = '';
  #onInput = (): void => { this.readControl(); this.commit(false); };
  #onChange = (): void => { this.readControl(); this.commit(true); };
  constructor() {
    super();
    if (typeof this.attachInternals === 'function') this.internals = this.attachInternals();
  }
  get value(): string { return this.#value; }
  set value(value: string) { this.#value = String(value ?? ''); this.syncControl(); this.syncFormValue(); }
  get name(): string { return this.getAttribute?.('name') ?? ''; }
  get disabled(): boolean { return this.hasAttribute?.('disabled') ?? false; }
  get required(): boolean { return this.hasAttribute?.('required') ?? false; }
  connectedCallback(): void { if (!this.root && typeof this.attachShadow === 'function') this.root = this.attachShadow({ mode: 'open' }); this.#value = this.getAttribute('value') ?? this.#value; this.render(); }
  disconnectedCallback(): void { this.unbind(); }
  attributeChangedCallback(name: string, _old: string | null, value: string | null): void { if (name === 'value' && value !== this.#value) this.#value = value ?? ''; if (this.root) this.render(); }
  formResetCallback(): void { this.value = this.getAttribute('value') ?? ''; }
  formDisabledCallback(disabled: boolean): void { this.toggleAttribute('disabled', disabled); }
  checkValidity(): boolean { return this.internals?.checkValidity() ?? this.control?.checkValidity() ?? true; }
  reportValidity(): boolean { return this.internals?.reportValidity() ?? this.control?.reportValidity() ?? true; }
  protected abstract controlMarkup(): string;
  protected render(): void {
    this.unbind();
    if (!this.root) return;
    const label = this.getAttribute('label') ?? '';
    const error = this.getAttribute('error') ?? '';
    const errorId = `${this.controlId}-error`;
    this.root.innerHTML = withAfricaniesShadowStyles(`${label ? `<label part="label" for="${this.controlId}">${html(label)}</label>` : ''}${this.controlMarkup()}${error ? `<div part="error" id="${errorId}" role="alert">${html(error)}</div>` : ''}`);
    this.control = this.root.querySelector('input,textarea,select');
    if (!this.control) return;
    this.control.id = this.controlId;
    this.control.disabled = this.disabled;
    this.control.required = this.required;
    if (error) { this.control.setAttribute('aria-invalid', 'true'); this.control.setAttribute('aria-describedby', errorId); this.internals?.setValidity({ customError: true }, error, this.control); }
    else this.internals?.setValidity({});
    this.syncControl();
    this.control.addEventListener('input', this.#onInput);
    this.control.addEventListener('change', this.#onChange);
  }
  protected readControl(): void { this.#value = this.control?.value ?? ''; this.syncFormValue(); }
  protected syncControl(): void { if (this.control && this.control.value !== this.#value) this.control.value = this.#value; }
  protected syncFormValue(): void { this.internals?.setFormValue(this.#value); }
  protected commit(change: boolean): void { this.dispatchEvent(new Event(change ? 'change' : 'input', { bubbles: true, composed: true })); }
  protected unbind(): void { this.control?.removeEventListener('input', this.#onInput); this.control?.removeEventListener('change', this.#onChange); this.control = null; }
  protected commonAttributes(): string { return `${this.getAttribute('placeholder') ? ` placeholder="${html(this.getAttribute('placeholder'))}"` : ''}${this.disabled ? ' disabled' : ''}${this.required ? ' required' : ''}`; }
}

export class TextInputComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'type', 'autocomplete'];
  protected controlMarkup(): string { const type = this.getAttribute('type') ?? 'text'; const autocomplete = this.getAttribute('autocomplete'); return `<input part="control" type="${html(type)}"${autocomplete ? ` autocomplete="${html(autocomplete)}"` : ''}${this.commonAttributes()}>`; }
}
export class TextareaComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'rows'];
  protected controlMarkup(): string { return `<textarea part="control" rows="${html(this.getAttribute('rows') ?? '3')}"${this.commonAttributes()}></textarea>`; }
}
export class NumberInputComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'min', 'max', 'step'];
  get valueAsNumber(): number | null { const number = Number(this.value); return this.value === '' || Number.isNaN(number) ? null : number; }
  protected controlMarkup(): string { return `<input part="control" type="number"${['min', 'max', 'step'].map(name => this.getAttribute(name) == null ? '' : ` ${name}="${html(this.getAttribute(name))}"`).join('')}${this.commonAttributes()}>`; }
}
export class DatePickerComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'min', 'max'];
  protected controlMarkup(): string { return `<input part="control" type="date"${['min', 'max'].map(name => this.getAttribute(name) == null ? '' : ` ${name}="${html(this.getAttribute(name))}"`).join('')}${this.commonAttributes()}>`; }
}
export class OtpInputComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'length'];
  protected readControl(): void { if (this.control) this.control.value = this.control.value.replace(/\D/g, '').slice(0, Number(this.getAttribute('length') ?? 6)); super.readControl(); }
  protected controlMarkup(): string { const length = Number(this.getAttribute('length') ?? 6); return `<input part="control" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="${length}"${this.commonAttributes()}>`; }
}

abstract class CheckableControlElement extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'checked'];
  get checked(): boolean { return this.hasAttribute('checked'); }
  set checked(value: boolean) { this.toggleAttribute('checked', value); }
  protected readControl(): void { this.checked = (this.control as HTMLInputElement | null)?.checked ?? false; this.syncFormValue(); }
  protected syncControl(): void { if (this.control) (this.control as HTMLInputElement).checked = this.checked; }
  protected syncFormValue(): void { this.internals?.setFormValue(this.checked ? (this.value || 'on') : null); }
  formResetCallback(): void { this.checked = this.hasAttribute('checked'); }
}
export class CheckboxComponent extends CheckableControlElement { protected controlMarkup(): string { return `<label part="control-label"><input part="control" type="checkbox"${this.commonAttributes()}><slot></slot></label>`; } }
export class RadioComponent extends CheckableControlElement { protected controlMarkup(): string { return `<label part="control-label"><input part="control" type="radio" name="${html(this.name)}"${this.commonAttributes()}><slot></slot></label>`; } }
export class ToggleComponent extends CheckableControlElement { static readonly observedAttributes = [...CheckableControlElement.observedAttributes, 'loading']; protected controlMarkup(): string { return `<label part="control-label"><input part="control" type="checkbox" role="switch"${this.hasAttribute('loading') ? ' aria-busy="true" disabled' : ''}${this.commonAttributes()}><slot></slot></label>`; } }

export class SelectComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'multiple'];
  #options: readonly SelectOption[] = [];
  create: SelectCreateConfig | null = null;
  modal: SelectModalAdapter | null = null;
  set options(value: readonly SelectOption[]) { this.#options = value; if (this.root) this.render(); }
  get options(): readonly SelectOption[] { return this.#options; }
  async invokeCreate(): Promise<void> {
    if (!this.create) return;
    if (!this.modal) { this.dispatchEvent(new CustomEvent('create-request', { bubbles: true, composed: true, detail: this.create })); return; }
    const result = await this.modal.open<unknown, unknown>(this.create.component, { data: this.create.data }).closed;
    if (result === undefined) return;
    const option = this.create.mapResult(result);
    this.#options = [...this.#options, option];
    this.value = String(option.value);
    this.dispatchEvent(new CustomEvent('options-change', { bubbles: true, composed: true, detail: this.#options }));
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.render();
  }
  protected render(): void { super.render(); if (!this.create || !this.root) return; const button = this.root.ownerDocument.createElement('button'); button.type = 'button'; button.part.add('create'); button.textContent = this.create.label; button.addEventListener('click', () => void this.invokeCreate(), { once: true }); this.root.append(button); }
  protected controlMarkup(): string { const placeholder = this.getAttribute('placeholder'); return `<select part="control"${this.hasAttribute('multiple') ? ' multiple' : ''}${this.commonAttributes()}>${placeholder ? `<option value="">${html(placeholder)}</option>` : ''}${this.#options.map(option => `<option value="${html(option.value)}"${option.disabled ? ' disabled' : ''}>${html(option.label)}</option>`).join('')}</select>`; }
}

export class SearchComboboxComponent extends FormControlElement {
  static readonly observedAttributes = [...FormControlElement.observedAttributes, 'min-query-length', 'debounce-ms'];
  #options: readonly SelectOption[] = [];
  #timer: ReturnType<typeof globalThis.setTimeout> | null = null;
  set options(value: readonly SelectOption[]) { this.#options = value; if (this.root) this.render(); }
  get options(): readonly SelectOption[] { return this.#options; }
  disconnectedCallback(): void { super.disconnectedCallback(); if (this.#timer) clearTimeout(this.#timer); }
  protected controlMarkup(): string { const listId = `${this.controlId}-list`; return `<input part="control" type="search" role="combobox" aria-autocomplete="list" aria-controls="${listId}" aria-expanded="${this.#options.length > 0}"${this.commonAttributes()}><ul part="listbox" id="${listId}" role="listbox">${this.#options.map(option => `<li role="option" data-value="${html(option.value)}">${html(option.label)}</li>`).join('')}</ul>`; }
  protected readControl(): void { super.readControl(); if (this.#timer) clearTimeout(this.#timer); const delay = Number(this.getAttribute('debounce-ms') ?? 500); this.#timer = setTimeout(() => { const min = Number(this.getAttribute('min-query-length') ?? 2); if (this.value.length >= min) this.dispatchEvent(new CustomEvent('search-query', { bubbles: true, composed: true, detail: { query: this.value } })); }, delay); }
}

export const AFRICANIES_FORM_ELEMENTS = Object.freeze({
  'africanies-text-input': TextInputComponent,
  'africanies-textarea': TextareaComponent,
  'africanies-number-input': NumberInputComponent,
  'africanies-checkbox': CheckboxComponent,
  'africanies-radio': RadioComponent,
  'africanies-toggle': ToggleComponent,
  'africanies-date-picker': DatePickerComponent,
  'africanies-otp-input': OtpInputComponent,
  'africanies-select': SelectComponent,
  'africanies-search-combobox': SearchComboboxComponent
});
