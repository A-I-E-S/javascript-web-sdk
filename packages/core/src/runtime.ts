import type { ShippingMode } from '@africanies/africanies-models';
import type { RequestOptions } from './index.js';

export function isValidEmail(value: unknown): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typeof value === 'string' ? value.trim() : ''); }
export function asShippingMode(value: unknown): ShippingMode { return value === 'stn' ? 'stn' : 'sfn'; }
export function withShippingMode(mode: ShippingMode): Pick<RequestOptions, 'shippingMode'> { return { shippingMode: mode }; }
export function asRecord(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null; }
export function asArray<T = unknown>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
export function mapArray<T>(value: unknown, mapper: (entry: unknown) => T): T[] { return asArray(value).map(mapper); }
export function mapList<T>(value: unknown, mapper: (entry: unknown) => T): T[] { return (Array.isArray(value) ? value : value == null ? [] : [value]).map(mapper); }
export function asNullableFlag01(value: unknown): '1' | '0' | null { if (value == null || value === '') return null; return value === true || value === 1 || value === '1' || value === 'true' ? '1' : '0'; }
export function mapApiJsonValue(value: unknown): unknown { if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value; if (Array.isArray(value)) return value.map(mapApiJsonValue); if (asRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, mapApiJsonValue(entry)])); return null; }
export function mapApiJsonList(value: unknown): unknown[] { return (Array.isArray(value) ? value : value == null ? [] : [value]).map(mapApiJsonValue); }
export function formatApiErrorMessage(error: unknown): string { const row = asRecord(error); if (typeof row?.message === 'string' && row.message.trim()) return row.message; return 'Something went wrong. Please try again.'; }
export function isLaravelValidationBag(value: unknown): value is Record<string, string[]> { const row = asRecord(value); return row !== null && Object.values(row).every(messages => Array.isArray(messages) && messages.every(message => typeof message === 'string')); }
export function mapLaravelValidationBag(value: unknown): Record<string, string[]> { return isLaravelValidationBag(value) ? Object.fromEntries(Object.entries(value).map(([key, messages]) => [key, [...messages]])) : {}; }
export function fieldErrorsMap(value: unknown): Map<string, string[]> { return new Map(Object.entries(mapLaravelValidationBag(value))); }
export function joinApiErrorMessages(value: unknown): string { return Object.values(mapLaravelValidationBag(value)).flat().join(' '); }
export type ListFetchReason = 'initial' | 'focus' | 'refresh' | 'page' | 'mode';
export type ListFetchKind = 'loading' | 'pagination' | 'refreshing';
export function listFetchKind(options: { hasData: boolean; reason: ListFetchReason }): ListFetchKind {
  if (!options.hasData || options.reason === 'mode') return 'loading';
  return options.reason === 'page' ? 'pagination' : 'refreshing';
}
export interface AfricaniesQueryClientDefaults { queries: { staleTime: number; retry: number; refetchOnWindowFocus: boolean } }
export function createAfricaniesQueryClientDefaults(): AfricaniesQueryClientDefaults { return { queries: { staleTime: 0, retry: 1, refetchOnWindowFocus: false } }; }
export const provideAfricaniesQueryDefaults = createAfricaniesQueryClientDefaults;
export const provideAfricaniesHttpClient = <T>(options: T): T => options;
export const provideModeConfig = <T>(service: T): T => service;
export const provideOverlayRoutes = <T>(config: T): T => config;
export const COUNTRY_FLAG_CDN_BASE = 'https://flagcdn.com';
export type CountryFlagFormat = 'png' | 'svg';
export interface CountryFlagUrlOptions { width?: number; format?: CountryFlagFormat }
export interface CountrySelectOption { value: string; label: string; prefixText: string; prefixImageUrl: string }
export function countryFlagUrl(countryCode: string | null | undefined, options: CountryFlagUrlOptions = {}): string { const code = String(countryCode ?? '').trim().toLowerCase(); if (!/^[a-z]{2}$/.test(code)) return ''; const format = options.format ?? 'svg'; return format === 'svg' ? `${COUNTRY_FLAG_CDN_BASE}/${code}.svg` : `${COUNTRY_FLAG_CDN_BASE}/w${options.width ?? 40}/${code}.png`; }
export function mapCountrySelectOptions(rows: Array<Record<string, unknown>> | null | undefined) { return (rows ?? []).map(row => ({ value: String(row.id ?? ''), label: String(row.name ?? ''), prefixText: countryFlagEmoji(String(row.iso2 ?? '')), prefixImageUrl: countryFlagUrl(String(row.iso2 ?? '')) })); }
function countryFlagEmoji(code: string): string { const normalized = code.trim().toUpperCase(); return /^[A-Z]{2}$/.test(normalized) ? [...normalized].map(letter => String.fromCodePoint(127397 + letter.charCodeAt(0))).join('') : ''; }
export function resolveNotificationLinkForMode(link: string | null | undefined, mode: ShippingMode): string | null { if (!link) return null; return link.replace(/\{mode\}/g, mode); }
export async function copyToClipboard(text: string, clipboard?: { writeText(value: string): Promise<void> }): Promise<boolean> { const target = clipboard ?? globalThis.navigator?.clipboard; if (!target?.writeText) return false; try { await target.writeText(text); return true; } catch { return false; } }
export type CsvCellValue = string | number | boolean | null | undefined;
export interface DownloadCsvOptions { filename: string; headers?: readonly CsvCellValue[]; rows: readonly (readonly CsvCellValue[])[]; bom?: boolean }
export function csvCell(value: CsvCellValue): string { const text = value == null ? '' : String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
export function toCsvString(options: Pick<DownloadCsvOptions, 'headers' | 'rows' | 'bom'>): string { const lines: string[] = []; if (options.headers?.length) lines.push(options.headers.map(csvCell).join(',')); for (const row of options.rows) lines.push(row.map(csvCell).join(',')); return `${options.bom === false ? '' : '\uFEFF'}${lines.length ? `${lines.join('\n')}\n` : ''}`; }
export function downloadCsv(options: DownloadCsvOptions): boolean { const documentRef = globalThis.document; const urlApi = globalThis.URL; if (!documentRef || !urlApi?.createObjectURL) return false; const url = urlApi.createObjectURL(new Blob([toCsvString(options)], { type: 'text/csv;charset=utf-8' })); const anchor = documentRef.createElement('a'); anchor.href = url; anchor.download = options.filename; anchor.rel = 'noopener'; documentRef.body.appendChild(anchor); anchor.click(); documentRef.body.removeChild(anchor); urlApi.revokeObjectURL(url); return true; }

/** Angular DI tokens/interceptors have no runtime equivalent; ApiClient middleware and explicit adapters replace them. */
export const ANGULAR_ONLY_CORE_EXPORTS = Object.freeze(['AFRICANIES_SDK_CONFIG', 'AFRICANIES_HTTP_TOAST', 'TOAST_HTTP_OPTIONS', 'SHIPPING_MODE_OVERRIDE', 'MODAL_SERVICE', 'DRAWER_SERVICE', 'OVERLAY_ROUTE_CONFIGS', 'authInterceptor', 'shipmentModeInterceptor', 'httpToastInterceptor']);
