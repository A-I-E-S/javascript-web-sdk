export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';
export interface ToastShowOptions { message: string; title?: string; variant?: ToastVariant; durationMs?: number | null; icon?: string; }
export interface ToastItem { id: string; message: string; title?: string; variant: ToastVariant; durationMs: number | null; icon?: string; count: number; expanded: boolean; createdAt: number; }
export const TOAST_DURATION_MS: Readonly<Record<ToastVariant, number | null>> = Object.freeze({ info: 4500, success: 4500, warning: 8000, danger: null });
export const TOAST_ICONS: Readonly<Record<ToastVariant, string>> = Object.freeze({ info: 'info-circle', success: 'check-circle', warning: 'warning', danger: 'warning' });
export const toastFingerprint = (variant: ToastVariant, title: string | undefined, message: string): string => `${variant}|${title ?? ''}|${message}`;
export type ToastListener = (items: readonly ToastItem[]) => void;

export interface ToastServiceOptions {
  document?: Document;
  setTimeout?: typeof globalThis.setTimeout;
  clearTimeout?: typeof globalThis.clearTimeout;
}

export const provideAfricaniesToasts = (options: ToastServiceOptions = {}): ToastService => new ToastService(options);

export class ToastService {
  #items: ToastItem[] = [];
  #listeners = new Set<ToastListener>();
  #timers = new Map<string, ReturnType<typeof globalThis.setTimeout>>();
  #fingerprints = new Map<string, string>();
  #document?: Document;
  #host: HTMLElement | null = null;
  #seq = 0;
  #setTimeout: typeof globalThis.setTimeout;
  #clearTimeout: typeof globalThis.clearTimeout;
  constructor(options: ToastServiceOptions = {}) {
    this.#document = options.document;
    this.#setTimeout = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
    this.#clearTimeout = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
  }
  get items(): readonly ToastItem[] { return this.#items; }
  get hasStacks(): boolean { return this.#items.some(item => item.count > 1); }
  get showHostActions(): boolean { return this.#items.length > 1 || this.hasStacks; }
  get allStacksExpanded(): boolean { const stacks = this.#items.filter(item => item.count > 1); return stacks.length > 0 && stacks.every(item => item.expanded); }
  subscribe(listener: ToastListener): () => void { this.#listeners.add(listener); listener(this.#items); return () => this.#listeners.delete(listener); }
  ensureHost(): HTMLElement | null {
    if (this.#host || !this.#document?.body) return this.#host;
    const host = this.#document.createElement('africanies-toast-host');
    (host as HTMLElement & { service?: ToastService }).service = this;
    host.setAttribute('aria-label', 'Notifications');
    this.#document.body.append(host);
    this.#host = host;
    return host;
  }
  show(options: ToastShowOptions): string {
    this.ensureHost();
    const variant = options.variant ?? 'info';
    const message = options.message.trim();
    if (!message) return '';
    const title = options.title?.trim() || undefined;
    const durationMs = options.durationMs === undefined ? TOAST_DURATION_MS[variant] : options.durationMs;
    const fingerprint = toastFingerprint(variant, title, message);
    const existingId = this.#fingerprints.get(fingerprint);
    const hit = this.#items.find(item => item.id === existingId);
    if (hit) {
      const bumped = { ...hit, count: hit.count + 1, createdAt: Date.now(), durationMs };
      this.#items = [bumped, ...this.#items.filter(item => item.id !== hit.id)];
      this.#armTimer(bumped); this.#emit(); return hit.id;
    }
    const item: ToastItem = { id: `africanies-toast-${++this.#seq}`, message, title, variant, durationMs, icon: options.icon, count: 1, expanded: false, createdAt: Date.now() };
    this.#fingerprints.set(fingerprint, item.id); this.#items = [item, ...this.#items]; this.#armTimer(item); this.#emit(); return item.id;
  }
  info(message: string, title?: string): string { return this.show({ variant: 'info', message, title }); }
  success(message: string, title?: string): string { return this.show({ variant: 'success', message, title }); }
  warning(message: string, title?: string): string { return this.show({ variant: 'warning', message, title }); }
  error(message: string, title?: string): string { return this.show({ variant: 'danger', message, title }); }
  dismissOne(id: string): void { const hit = this.#items.find(item => item.id === id); if (!hit) return; if (hit.count <= 1) { this.dismiss(id); return; } const next = { ...hit, count: hit.count - 1, expanded: hit.expanded && hit.count > 2, createdAt: Date.now() }; this.#items = this.#items.map(item => item.id === id ? next : item); this.#armTimer(next); this.#emit(); }
  dismiss(id: string): void { this.#clearTimer(id); for (const [key, value] of this.#fingerprints) if (value === id) this.#fingerprints.delete(key); this.#items = this.#items.filter(item => item.id !== id); this.#emit(); }
  expand(id: string): void { this.#update(id, item => item.count > 1 ? { ...item, expanded: true } : item); }
  collapse(id: string): void { this.#update(id, item => ({ ...item, expanded: false })); }
  expandAll(): void { this.#items = this.#items.map(item => item.count > 1 ? { ...item, expanded: true } : item); this.#emit(); }
  collapseAll(): void { this.#items = this.#items.map(item => ({ ...item, expanded: false })); this.#emit(); }
  pause(id: string): void { this.#clearTimer(id); }
  resume(id: string): void { const item = this.#items.find(candidate => candidate.id === id); if (item) this.#armTimer(item); }
  clear(): void { for (const id of this.#timers.keys()) this.#clearTimer(id); this.#fingerprints.clear(); this.#items = []; this.#emit(); }
  destroy(): void { this.clear(); this.#listeners.clear(); this.#host?.remove(); this.#host = null; }
  #update(id: string, update: (item: ToastItem) => ToastItem): void { this.#items = this.#items.map(item => item.id === id ? update(item) : item); this.#emit(); }
  #emit(): void { for (const listener of this.#listeners) listener(this.#items); }
  #armTimer(item: ToastItem): void { this.#clearTimer(item.id); if (item.durationMs == null || item.durationMs <= 0) return; this.#timers.set(item.id, this.#setTimeout(() => this.dismissOne(item.id), item.durationMs)); }
  #clearTimer(id: string): void { const timer = this.#timers.get(id); if (timer !== undefined) { this.#clearTimeout(timer); this.#timers.delete(id); } }
}
