import { AFRICANIES_ACCESS_TOKEN_KEY, AFRICANIES_SHIPPING_MODE_KEY, LocalStorageService, SessionStorageService, type StorageService } from '@africanies/africanies-storage';
import type { ShippingMode } from '@africanies/africanies-models';

export const CORE_PACKAGE_NAME = '@africanies/africanies-core';
export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryParams = Readonly<Record<string, QueryPrimitive | readonly QueryPrimitive[]>>;
export interface TokenReader { getToken(): string | null; }
export interface ShippingModeReader { getMode(): ShippingMode; }
export interface ClearableCache { clear(): void; }

export class AuthTokenService implements TokenReader {
  constructor(private readonly storage: StorageService = new LocalStorageService(), private readonly responseCache?: ClearableCache) {}
  getToken(): string | null { const value = this.storage.get<unknown>(AFRICANIES_ACCESS_TOKEN_KEY); return typeof value === 'string' && value.trim() ? value : null; }
  setToken(token: string): void { const value = token.trim(); if (!value) { this.clearToken(); return; } this.storage.set(AFRICANIES_ACCESS_TOKEN_KEY, value); }
  clearToken(): void { this.storage.remove(AFRICANIES_ACCESS_TOKEN_KEY); this.responseCache?.clear(); }
  get(): string | null { return this.getToken(); }
  set(token: string): void { this.setToken(token); }
  clear(): void { this.clearToken(); }
}

export type ShippingModeChangeGuard = (next: ShippingMode, current: ShippingMode) => boolean | Promise<boolean>;
export class ShippingModeService implements ShippingModeReader {
  private mode: ShippingMode;
  private guard?: ShippingModeChangeGuard;
  private readonly listeners = new Set<(mode: ShippingMode) => void>();
  constructor(private readonly storage: StorageService = new SessionStorageService(), private readonly responseCache?: ClearableCache) {
    const value = storage.get<unknown>(AFRICANIES_SHIPPING_MODE_KEY);
    this.mode = isShippingMode(value) ? value : 'sfn';
    if (!isShippingMode(value)) storage.set(AFRICANIES_SHIPPING_MODE_KEY, this.mode);
  }
  getMode(): ShippingMode { return this.mode; }
  setChangeGuard(guard?: ShippingModeChangeGuard): void { this.guard = guard; }
  async setMode(next: ShippingMode): Promise<boolean> {
    if (!isShippingMode(next)) throw new TypeError(`Unsupported shipping mode: ${String(next)}`);
    if (next === this.mode) return true;
    if (this.guard && !await this.guard(next, this.mode)) return false;
    this.mode = next; this.storage.set(AFRICANIES_SHIPPING_MODE_KEY, next); this.responseCache?.clear();
    for (const listener of [...this.listeners]) listener(next);
    return true;
  }
  subscribe(listener: (mode: ShippingMode) => void): () => void { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
}
export function isShippingMode(value: unknown): value is ShippingMode { return value === 'sfn' || value === 'stn'; }

interface CacheEntry<T> { expiresAt: number; value: T; }
export class HttpResponseCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  readonly defaultTtlMs: number;
  constructor(options: { defaultTtlMs?: number } = {}) { this.defaultTtlMs = options.defaultTtlMs ?? 0; }
  get<T>(key: string): T | undefined { const entry = this.entries.get(key); if (!entry) return undefined; if (entry.expiresAt <= Date.now()) { this.entries.delete(key); return undefined; } return entry.value as T; }
  set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void { if (Number.isFinite(ttlMs) && ttlMs > 0) this.entries.set(key, { value, expiresAt: Date.now() + ttlMs }); }
  delete(key: string): boolean { return this.entries.delete(key); }
  clear(): void { this.entries.clear(); }
  get size(): number { return this.entries.size; }
}

export interface LaravelPaginator<T> { data: T[]; current_page?: number; per_page?: number; last_page?: number; total?: number; next_page_url?: string | null; prev_page_url?: string | null; [key: string]: unknown; }
export interface NormalizedPagination<T> { data: T[]; current_page: number; per_page: number; total_items: number; total_pages: number; has_next_page: boolean; has_previous_page: boolean; }
export function unwrapLaravelPaginator<T>(value: LaravelPaginator<T> | { data: LaravelPaginator<T> }): LaravelPaginator<T> { return isRecord(value) && isRecord(value.data) && Array.isArray(value.data.data) ? value.data as unknown as LaravelPaginator<T> : value as LaravelPaginator<T>; }
export function normalizePagination<T>(value: LaravelPaginator<T> | { data: LaravelPaginator<T> }): NormalizedPagination<T> {
  const page = unwrapLaravelPaginator(value); const current = finiteNumber(page.current_page, 1); const perPage = finiteNumber(page.per_page, page.data.length); const total = finiteNumber(page.total, page.data.length); const pages = finiteNumber(page.last_page, perPage > 0 ? Math.ceil(total / perPage) : 1);
  return { data: page.data, current_page: current, per_page: perPage, total_items: total, total_pages: pages, has_next_page: page.next_page_url != null || current < pages, has_previous_page: page.prev_page_url != null || current > 1 };
}
export function normalize<T>(value: T | { data: T }): T { return isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'data') ? value.data as T : value as T; }
export function coerceWireBoolean(value: unknown): boolean { return value === true || value === 1 || value === '1' || value === 'true'; }
export function coerceWireNumber(value: unknown): number | null { if (value === null || value === undefined || value === '') return null; const result = typeof value === 'number' ? value : Number(value); return Number.isFinite(result) ? result : null; }
export function resourcePath(basePath: string, resource?: number | string | null): string { const base = `/${basePath.replace(/^\/+|\/+$/g, '')}`; return resource == null ? base : `${base}/${encodeURIComponent(String(resource))}`; }
export function resourceQuery(resource?: number | string | null, query: QueryParams = {}): QueryParams { return resource == null ? { perPage: 15, ...query } : query; }

export class ApiError extends Error { constructor(message: string, public readonly status: number, public readonly details?: unknown, public readonly response?: Response) { super(message); this.name = 'ApiError'; } }
export interface ToastHttpOptions { success: boolean; error: boolean; successMessage?: string; errorMessage?: string; }
export interface RequestOptions { query?: QueryParams; headers?: HeadersInit; signal?: AbortSignal; timeoutMs?: number; shippingMode?: ShippingMode; cache?: boolean | number; raw?: boolean; normalize?: boolean; retry?: boolean; toast?: ToastHttpOptions; }
/** Framework-neutral per-request equivalent of Angular HttpContext tagging. */
export function withToast(options: Partial<ToastHttpOptions> = {}): Pick<RequestOptions, 'toast'> { return { toast: { success: options.success ?? true, error: options.error ?? true, successMessage: options.successMessage, errorMessage: options.errorMessage } }; }
export interface ApiRequestContext { method: string; url: string; init: RequestInit; options: RequestOptions; }
export type ApiMiddleware = (context: ApiRequestContext, next: (context?: ApiRequestContext) => Promise<Response>) => Promise<Response>;
export interface ApiClientOptions { baseUrl: string; fetch?: typeof globalThis.fetch; timeoutMs?: number; retryDelayMs?: number; defaultHeaders?: HeadersInit; authToken?: TokenReader; shippingMode?: ShippingModeReader; cache?: HttpResponseCache; middleware?: readonly ApiMiddleware[]; }

export class ApiClient {
  readonly cache: HttpResponseCache;
  private readonly fetchImplementation: typeof globalThis.fetch;
  private readonly middleware: ApiMiddleware[];
  constructor(private readonly config: ApiClientOptions) {
    if (!config.baseUrl.trim()) throw new TypeError('ApiClient baseUrl must not be empty');
    const implementation = config.fetch ?? globalThis.fetch; if (typeof implementation !== 'function') throw new ReferenceError('fetch is unavailable; inject a fetch implementation');
    this.fetchImplementation = implementation; this.cache = config.cache ?? new HttpResponseCache(); this.middleware = [...(config.middleware ?? [])];
  }
  use(middleware: ApiMiddleware): () => void { this.middleware.push(middleware); return () => { const index = this.middleware.indexOf(middleware); if (index >= 0) this.middleware.splice(index, 1); }; }
  get<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> { return this.request<T>('GET', path, undefined, options); }
  post<T = unknown>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> { return this.request<T>('POST', path, body, options); }
  put<T = unknown>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> { return this.request<T>('PUT', path, body, options); }
  patch<T = unknown>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> { return this.request<T>('PATCH', path, body, options); }
  delete<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> { return this.request<T>('DELETE', path, undefined, options); }
  async request<T = unknown>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const upper = method.toUpperCase(); const url = buildUrl(this.config.baseUrl, path, options.query); const headers = new Headers(this.config.defaultHeaders);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    const token = this.config.authToken?.getToken(); if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);
    const mode = options.shippingMode ?? this.config.shippingMode?.getMode(); if (mode && !headers.has('x-shipment-mode')) headers.set('x-shipment-mode', mode);
    const encodedBody = encodeBody(body, headers, upper); const cacheKey = `${upper} ${url} ${headers.get('authorization') ?? ''} ${headers.get('x-shipment-mode') ?? ''}`;
    const ttl = options.cache === true ? this.cache.defaultTtlMs : typeof options.cache === 'number' ? options.cache : 0;
    if (upper === 'GET' && ttl > 0) { const cached = this.cache.get<T>(cacheKey); if (cached !== undefined) return cached; }
    const signalScope = createRequestSignal(options.signal, options.timeoutMs ?? this.config.timeoutMs ?? 30_000);
    const context: ApiRequestContext = { method: upper, url, options, init: { method: upper, headers, body: encodedBody, signal: signalScope.signal } };
    try {
      const response = await this.executeWithRetry(context); if (options.raw) return response as T; const parsed = await parseResponse(response); if (!response.ok) throw apiErrorFrom(response, parsed);
      const result = options.normalize === false ? parsed : normalize(parsed); if (upper === 'GET' && ttl > 0) this.cache.set(cacheKey, result, ttl); return result as T;
    } finally { signalScope.cleanup(); }
  }
  private async executeWithRetry(context: ApiRequestContext): Promise<Response> {
    const retry = context.method === 'GET' && context.options.retry !== false;
    for (let attempt = 0; ; attempt += 1) { try { const response = await this.dispatch(context); if (!retry || attempt > 0 || !isRetryableStatus(response.status)) return response; } catch (error) { if (!retry || attempt > 0 || context.init.signal?.aborted) throw error; } await delay(this.config.retryDelayMs ?? 1000, context.init.signal); }
  }
  private dispatch(context: ApiRequestContext): Promise<Response> { let index = -1; const invoke = (current: ApiRequestContext): Promise<Response> => { index += 1; const middleware = this.middleware[index]; return middleware ? middleware(current, next => invoke(next ?? current)) : this.fetchImplementation(current.url, current.init); }; return invoke(context); }
}

export function createAfricaniesSdk(options: ApiClientOptions): { apiClient: ApiClient; authTokenService: AuthTokenService; shippingModeService: ShippingModeService } {
  const cache = options.cache ?? new HttpResponseCache(); const authTokenService = options.authToken instanceof AuthTokenService ? options.authToken : new AuthTokenService(undefined, cache); const shippingModeService = options.shippingMode instanceof ShippingModeService ? options.shippingMode : new ShippingModeService(undefined, cache);
  return { apiClient: new ApiClient({ ...options, authToken: options.authToken ?? authTokenService, shippingMode: options.shippingMode ?? shippingModeService, cache }), authTokenService, shippingModeService };
}
export const provideAfricaniesSdk = createAfricaniesSdk;
export * from './domain.js';
export * from './runtime.js';

function buildUrl(baseUrl: string, path: string, query?: QueryParams): string { const joined = /^https?:\/\//i.test(path) ? path : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`; const url = new URL(joined); if (query) for (const [key, raw] of Object.entries(query)) for (const value of Array.isArray(raw) ? raw : [raw]) if (value !== null && value !== undefined && value !== '') url.searchParams.append(key, String(value)); return url.toString(); }
function encodeBody(body: unknown, headers: Headers, method: string): BodyInit | undefined { if (body === undefined || method === 'GET' || method === 'HEAD') return undefined; if (isNativeBody(body)) return body; if (!headers.has('content-type')) headers.set('content-type', 'application/json'); return JSON.stringify(body); }
function isNativeBody(body: unknown): body is BodyInit { return typeof body === 'string' || body instanceof URLSearchParams || typeof Blob !== 'undefined' && body instanceof Blob || typeof FormData !== 'undefined' && body instanceof FormData || typeof ArrayBuffer !== 'undefined' && (body instanceof ArrayBuffer || ArrayBuffer.isView(body)); }
function createRequestSignal(external: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; cleanup(): void } { const controller = new AbortController(); const abort = () => controller.abort(external?.reason); if (external?.aborted) abort(); else external?.addEventListener('abort', abort, { once: true }); const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError')), timeoutMs) : undefined; return { signal: controller.signal, cleanup: () => { if (timeout !== undefined) clearTimeout(timeout); external?.removeEventListener('abort', abort); } }; }
async function parseResponse(response: Response): Promise<unknown> { if (response.status === 204 || response.status === 205) return null; const text = await response.text(); if (!text) return null; if ((response.headers.get('content-type') ?? '').includes('json')) { try { return JSON.parse(text) as unknown; } catch { throw new ApiError('The server returned invalid JSON', response.status, text, response); } } return text; }
function apiErrorFrom(response: Response, details: unknown): ApiError { let message = `Request failed with status ${response.status}`; if (typeof details === 'string' && details.trim()) message = details; else if (isRecord(details) && typeof details.message === 'string' && details.message.trim()) message = details.message; else if (isRecord(details) && isRecord(details.errors)) { const first = Object.values(details.errors).flat().find(value => typeof value === 'string'); if (typeof first === 'string') message = first; } return new ApiError(message, response.status, details, response); }
function isRetryableStatus(status: number): boolean { return status === 408 || status === 425 || status === 429 || status >= 500; }
function delay(ms: number, signal?: AbortSignal | null): Promise<void> { if (ms <= 0) return Promise.resolve(); return new Promise((resolve, reject) => { const timeout = setTimeout(done, ms); const abort = () => { clearTimeout(timeout); signal?.removeEventListener('abort', abort); reject(signal?.reason); }; function done() { signal?.removeEventListener('abort', abort); resolve(); } signal?.addEventListener('abort', abort, { once: true }); }); }
function finiteNumber(value: unknown, fallback: number): number { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
