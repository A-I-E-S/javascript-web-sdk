export type OverlaySurface = 'modal' | 'drawer';
export type ModalSize = 'md' | 'lg' | 'xl';
export const MODAL_SIZE_PANEL_CLASS: Readonly<Record<ModalSize, readonly string[]>> = Object.freeze({ md: ['max-w-lg', 'w-[min(calc(100%-2rem),32rem)]'], lg: ['max-w-2xl', 'w-[min(calc(100%-2rem),42rem)]'], xl: ['max-w-4xl', 'w-[min(calc(100%-2rem),56rem)]'] });
export interface OverlayOpenConfig<TData = unknown> { data?: TData; dismissible?: boolean; panelClass?: string | readonly string[]; }
export interface ModalOpenConfig<TData = unknown> extends OverlayOpenConfig<TData> { size?: ModalSize; }
export interface OverlayContext<TData, TResult> { data: TData | undefined; ref: AfricaniesOverlayRef<TResult>; document: Document; }
export type OverlayContent<TData, TResult> = Node | ((context: OverlayContext<TData, TResult>) => Node);
export interface OverlayEnvironment { document?: Document; }
export const OVERLAY_DATA = Symbol.for('@africanies/ui/overlay-data');
export interface AfricaniesUiOverlayServices { modal: ModalService; drawer: DrawerService; confirm: ConfirmService; }

export class AfricaniesOverlayRef<TResult = unknown> {
  #settled = false;
  #result: TResult | undefined;
  #listeners = new Set<(result: TResult | undefined) => void>();
  #resolve!: (result: TResult | undefined) => void;
  readonly closed: Promise<TResult | undefined> = new Promise(resolve => { this.#resolve = resolve; });
  constructor(private readonly dispose: () => void | Promise<void>, private readonly restoreFocus?: () => void) {}
  get isClosed(): boolean { return this.#settled; }
  close(result?: TResult): void { if (this.#settled) return; this.#settled = true; this.#result = result; void Promise.resolve(this.dispose()).catch(() => undefined).then(() => { this.#resolve(result); for (const listener of this.#listeners) listener(result); this.#listeners.clear(); this.restoreFocus?.(); }); }
  afterClosed(listener?: (result: TResult | undefined) => void): Promise<TResult | undefined> | (() => void) { if (!listener) return this.closed; if (this.#settled) { queueMicrotask(() => listener(this.#result)); return () => undefined; } this.#listeners.add(listener); return () => this.#listeners.delete(listener); }
}

const focusableSelector = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
class OverlayService {
  constructor(private readonly surface: OverlaySurface, private readonly environment: OverlayEnvironment = {}) {}
  open<TData = unknown, TResult = unknown>(content: OverlayContent<TData, TResult>, config: ModalOpenConfig<TData> = {}): AfricaniesOverlayRef<TResult> {
    const document = this.environment.document;
    if (!document?.body) throw new Error('Overlay services require an injected browser document.');
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const backdrop = document.createElement('div');
    backdrop.className = 'africanies-overlay-backdrop fixed inset-0 z-[1000] flex bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70';
    const panel = document.createElement('div');
    panel.className = this.surface === 'drawer'
      ? 'africanies-drawer-panel ml-auto h-full w-[min(100%,32rem)] overflow-y-auto bg-white text-slate-900 shadow-2xl outline-none dark:bg-slate-950 dark:text-white'
      : 'africanies-modal-panel m-auto max-h-[calc(100dvh-2rem)] w-[min(calc(100%-2rem),32rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white text-slate-900 shadow-2xl outline-none dark:border-white/15 dark:bg-slate-950 dark:text-white';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.tabIndex = -1;
    panel.dataset.surface = this.surface;
    if (this.surface === 'modal') panel.dataset.size = config.size ?? 'md';
    const classes = config.panelClass == null ? [] : typeof config.panelClass === 'string' ? [config.panelClass] : config.panelClass;
    panel.classList.add(...classes);
    backdrop.append(panel); document.body.append(backdrop); document.body.style.overflow = 'hidden';
    let keydown: ((event: KeyboardEvent) => void) | null = null;
    let backdropClick: ((event: MouseEvent) => void) | null = null;
    const ref = new AfricaniesOverlayRef<TResult>(() => { if (keydown) document.removeEventListener('keydown', keydown); if (backdropClick) backdrop.removeEventListener('click', backdropClick); backdrop.remove(); document.body.style.overflow = previousOverflow; }, () => previousFocus?.focus());
    const node = typeof content === 'function' ? content({ data: config.data, ref, document }) : content; panel.append(node);
    keydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && config.dismissible) { event.preventDefault(); ref.close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(focusableSelector)];
      if (focusable.length === 0) { event.preventDefault(); panel.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    backdropClick = (event: MouseEvent): void => { if (config.dismissible && event.target === backdrop) ref.close(); };
    document.addEventListener('keydown', keydown); backdrop.addEventListener('click', backdropClick);
    (panel.querySelector<HTMLElement>(focusableSelector) ?? panel).focus();
    return ref;
  }
}
export class ModalService extends OverlayService { constructor(environment: OverlayEnvironment = {}) { super('modal', environment); } }
export class DrawerService extends OverlayService { constructor(environment: OverlayEnvironment = {}) { super('drawer', environment); } }

export type ConfirmWork = () => Promise<unknown> | void;
export interface ConfirmOptions { title?: string; message: string; confirmLabel?: string; cancelLabel?: string; emphasizeCancel?: boolean; danger?: boolean; dismissible?: boolean; onConfirm?: ConfirmWork; }
type HTMLElementConstructor = typeof HTMLElement;
const HTMLElementBase: HTMLElementConstructor = (globalThis.HTMLElement ?? class {}) as HTMLElementConstructor;
const escapeHtml = (value: unknown): string => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/** Framework-neutral equivalent of the canonical confirm dialog component. */
export class ConfirmDialogComponent extends HTMLElementBase {
  #options: ConfirmOptions = { message: '' };
  #ref: AfricaniesOverlayRef<boolean> | null = null;
  #root: ShadowRoot | null = null;
  #loading = false;
  get options(): ConfirmOptions { return this.#options; }
  set options(value: ConfirmOptions) { this.#options = value; this.render(); }
  get ref(): AfricaniesOverlayRef<boolean> | null { return this.#ref; }
  set ref(value: AfricaniesOverlayRef<boolean> | null) { this.#ref = value; }
  get loading(): boolean { return this.#loading; }
  connectedCallback(): void { if (!this.#root && typeof this.attachShadow === 'function') this.#root = this.attachShadow({ mode: 'open' }); this.render(); }
  cancel(): void { if (!this.#loading) { this.#ref?.close(false); this.dispatchEvent(new CustomEvent('cancelled', { bubbles: true, composed: true })); } }
  async confirm(): Promise<boolean> {
    if (this.#loading) return false;
    this.#loading = true; this.render();
    try {
      await this.#options.onConfirm?.();
      this.#ref?.close(true);
      this.dispatchEvent(new CustomEvent('confirmed', { bubbles: true, composed: true }));
      return true;
    } catch (error) {
      this.dispatchEvent(new CustomEvent('confirm-error', { bubbles: true, composed: true, detail: error }));
      return false;
    } finally {
      this.#loading = false;
      if (!this.#ref?.isClosed) this.render();
    }
  }
  private render(): void {
    if (!this.#root) return;
    const options = this.#options;
    const cancel = `<button type="button" part="cancel" data-action="cancel"${this.#loading ? ' disabled' : ''}>${escapeHtml(options.cancelLabel ?? 'Cancel')}</button>`;
    const confirm = `<button type="button" part="confirm" data-action="confirm" data-variant="${options.danger ? 'danger' : 'primary'}"${this.#loading ? ' disabled' : ''}>${escapeHtml(options.confirmLabel ?? 'Confirm')}</button>`;
    this.#root.innerHTML = withAfricaniesShadowStyles(`<section part="dialog" role="alertdialog" aria-labelledby="confirm-title"${this.#loading ? ' aria-busy="true"' : ''}><h2 id="confirm-title">${escapeHtml(options.title ?? 'Confirm')}</h2><p>${escapeHtml(options.message)}</p><div part="actions">${options.emphasizeCancel ? `${confirm}${cancel}` : `${cancel}${confirm}`}</div></section>`);
    this.#root.querySelector('[data-action="cancel"]')?.addEventListener('click', () => this.cancel());
    this.#root.querySelector('[data-action="confirm"]')?.addEventListener('click', () => { void this.confirm(); });
  }
}
export class ConfirmService {
  constructor(private readonly modal: ModalService) {}
  confirm(options: ConfirmOptions): Promise<boolean> {
    const overlayRef = this.modal.open<ConfirmOptions, boolean>(({ data, document, ref }) => {
      const registry = document.defaultView?.customElements;
      if (registry && !registry.get('africanies-confirm-dialog')) registry.define('africanies-confirm-dialog', ConfirmDialogComponent);
      const dialog = document.createElement('africanies-confirm-dialog') as ConfirmDialogComponent;
      dialog.options = data ?? { message: '' };
      dialog.ref = ref;
      return dialog;
    }, { data: options, dismissible: options.dismissible });
    return overlayRef.closed.then(result => result === true);
  }
}

export function provideAfricaniesUiOverlays(environment: OverlayEnvironment = {}): AfricaniesUiOverlayServices {
  const modal = new ModalService(environment);
  const drawer = new DrawerService(environment);
  return { modal, drawer, confirm: new ConfirmService(modal) };
}
import { withAfricaniesShadowStyles } from './styles.js';
