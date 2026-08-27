/**
 * Schema-driven list filter contracts for AFRICANIES modules.
 *
 * Modules declare a {@link ModuleFilterConfigModel}; the UI drawer renders from
 * it and {@link toFilterParams} / {@link fromFilterParams} speak to the API.
 */

/**
 * Backend wire format for filter query serialization.
 *
 * Use {@link resolveFilterTransport} when reading `config.transport` — omit the
 * property on {@link ModuleFilterConfigModel} to default to legacy-parallel.
 */
export const FilterTransport = {
  /** Laravel-style `filterColumn` + `filterValue` CSV pairs (default). */
  LegacyParallel: 'legacy-parallel',
  /** Each {@link FilterFieldModel.key} is its own query param. */
  Named: 'named',
} as const;

/** Union of {@link FilterTransport} literal values. */
export type FilterTransport =
  (typeof FilterTransport)[keyof typeof FilterTransport];

/** Default when {@link ModuleFilterConfigModel.transport} is omitted. */
export const DEFAULT_FILTER_TRANSPORT = FilterTransport.LegacyParallel;

/** How a filter field is rendered and validated in the drawer. */
export type FilterFieldType =
  /** Chip / single-select group — exclusive within the field by default. */
  | 'enum'
  /** Free-text scalar (tracking number, etc.). */
  | 'text'
  /** Static or host-resolved option list (warehouse, carrier, …). */
  | 'select'
  /** Yes/no mapped to API scalars (often `'1'` / `'0'`). */
  | 'boolean';

/**
 * Option row for enum / select / boolean fields.
 *
 * `color` is a UI hint only (chip styling) — never sent to the API.
 */
export interface FilterOptionModel {
  /** Canonical value written into filter state / query params. */
  value: string;
  /** Visible label. */
  label: string;
  /** Optional leading text/emoji (e.g. country flag emoji) in select rows. */
  prefixText?: string;
  /** Optional leading image URL (e.g. flag CDN from {@link countryFlagUrl}). */
  prefixImageUrl?: string;
  /** Optional chip / badge color (hex or CSS). */
  color?: string;
}

/**
 * Well-known async option catalogs resolved by the SDK or host app.
 *
 * Built-in wiring ({@link FilterOptionsResolver} in `@africanies/africanies-core`):
 * - `warehouses` → {@link WarehouseService.readAll} → field keys like `warehouse_id`
 * - `shipmentMethods` → {@link ShipmentMethodService.readAll} → e.g. `shipment_method_id`
 *
 * Pass host `optionLists` for sources without a built-in service (e.g. `shipmentManifests`).
 */
export type FilterOptionsSource =
  | 'shipmentMethods'
  | 'warehouses'
  | 'shipmentManifests'
  | 'static';

/**
 * One filterable API field inside a {@link ModuleFilterConfigModel}.
 */
export interface FilterFieldModel {
  /** API `filterColumn` name (e.g. `payment_status`). */
  key: string;
  /** Drawer section label. */
  label: string;
  /** Control kind. */
  type: FilterFieldType;
  /** Static options (enum / boolean / static select). */
  options?: FilterOptionModel[];
  /**
   * When true (default for `enum`), selecting a value replaces any prior value
   * for this key — chip groups are mutually exclusive per field.
   */
  exclusive?: boolean;
  /** Host-resolved option catalog name for `select` fields. */
  optionsSource?: FilterOptionsSource;
  /** Placeholder for text / select triggers. */
  placeholder?: string;
}

/**
 * Module-level filter schema — the only per-module difference for list filters.
 *
 * @example
 * ```ts
 * const trackShipmentsFilterConfig: ModuleFilterConfigModel = {
 *   id: 'track-shipments',
 *   // transport omitted → FilterTransport.LegacyParallel
 *   fields: [
 *     { key: 'payment_status', label: 'Payment Status', type: 'enum', options: […] },
 *   ],
 * };
 * ```
 */
export interface ModuleFilterConfigModel {
  /** Stable module id (`track-shipments`, `users`, …). */
  id: string;
  /**
   * Optional portal route segments for docs / deep links
   * (e.g. `['portal', 'shipment', 'track-shipments']`).
   */
  route?: string[];
  /** Free-text search box. */
  search?: {
    param: 'search';
    label: string;
    placeholder?: string;
  };
  /** Date range + which date column the range applies to. */
  date?: {
    rangeParams: { from: 'from'; to: 'to' };
    fieldParam: 'date';
    fields: FilterOptionModel[];
  };
  /** Sort direction control. */
  sort?: {
    param: 'order';
    options: FilterOptionModel[];
  };
  /** Pagination query param names (defaults when omitted at serialize time). */
  pagination?: {
    pageParam: 'page';
    sizeParam: 'size';
  };
  /** Filterable fields rendered in the drawer. */
  fields: FilterFieldModel[];
  /**
   * Backend wire format — see {@link FilterTransport}.
   * Defaults to {@link DEFAULT_FILTER_TRANSPORT} when omitted.
   */
  transport?: FilterTransport;
}

/**
 * Preferred UI / feature state for filters.
 *
 * Keep values as a map keyed by {@link FilterFieldModel.key}; only flatten to
 * parallel comma strings at the API / URL boundary.
 */
export interface FilterStateModel {
  search?: string;
  /** Inclusive range start (`YYYY-MM-DD`). */
  from?: string;
  /** Inclusive range end (`YYYY-MM-DD`). */
  to?: string;
  /** Which date column `from`/`to` apply to (`created_at`, …). */
  date?: string;
  order?: 'asc' | 'desc' | string;
  page?: number;
  size?: number;
  /**
   * Field values keyed by {@link FilterFieldModel.key}.
   * Omit or set `undefined` / `''` to exclude from serialization.
   */
  values: Record<string, string | undefined>;
}

/**
 * Flat query / API bag produced by {@link toFilterParams}.
 * Values are strings (or numbers for page/size) ready for HttpParams / router.
 */
export type FilterParamsModel = Record<string, string | number | undefined>;

/**
 * Resolved transport for a module config (defaults to {@link DEFAULT_FILTER_TRANSPORT}).
 * @param config
 */
export function resolveFilterTransport(
  config: Pick<ModuleFilterConfigModel, 'transport'>,
): FilterTransport {
  return config.transport ?? DEFAULT_FILTER_TRANSPORT;
}
