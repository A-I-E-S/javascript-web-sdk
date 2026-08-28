import type { FilterParamsModel, FilterStateModel, ModuleFilterConfigModel } from './filter-config.model.js';
/** Router / HTTP query bag accepted by {@link fromFilterParams}. */
export type FilterQueryBag = Record<string, string | number | null | undefined | readonly string[]>;
/**
 * Empty filter state — safe default before hydrate / after reset.
 *
 * Sort defaults to descending (`desc`) so list screens match the usual
 * “newest first” API contract without an explicit Apply.
 *
 * @returns A state with an empty `values` map and `order: 'desc'`.
 */
export declare function emptyFilterState(): FilterStateModel;
/**
 * Clone state so drawer edits do not mutate the host until Apply.
 *
 * @param state - Current filter state (or undefined).
 * @returns A shallow copy safe to mutate in the drawer.
 */
export declare function cloneFilterState(state?: FilterStateModel | null): FilterStateModel;
/**
 * Serialize {@link FilterStateModel} for URL query strings and list API calls.
 *
 * - `legacy-parallel`: emits `filterColumn` / `filterValue` as aligned CSV.
 * - `named`: each selected field key is its own query param.
 *
 * Empty strings and undefined field values are omitted.
 *
 * @param state - Current filter map state.
 * @param config - Module schema (controls transport + shared params).
 * @returns Flat query / API bag ready for HttpParams or the router.
 */
export declare function toFilterParams(state: FilterStateModel, config: ModuleFilterConfigModel): FilterParamsModel;
/**
 * Hydrate {@link FilterStateModel} from a flat query / API bag.
 *
 * For `legacy-parallel`, zips `filterColumn` + `filterValue` CSV pairs.
 * Unknown column keys are still restored into `values` so round-trips survive
 * config drift.
 *
 * @param params - Router query params or API query object (stringish values).
 * @param config - Module schema.
 * @returns Hydrated {@link FilterStateModel}.
 */
export declare function fromFilterParams(params: FilterQueryBag, config: ModuleFilterConfigModel): FilterStateModel;
/**
 * Query keys this config reads and writes (`search`, `page`, `size`, field
 * keys or `filterColumn` / `filterValue`, etc.).
 *
 * @param config - Module schema.
 * @returns Deduped list of query param names.
 */
export declare function filterQueryKeys(config: ModuleFilterConfigModel): string[];
/**
 * True when the bag contains any list-filter / pagination key this config
 * understands. Used to decide whether to hydrate from the URL.
 *
 * @param params - Router query params or API query object.
 * @param config - Module schema.
 * @returns Whether at least one relevant non-empty param is present.
 */
export declare function hasFilterParams(params: FilterQueryBag, config: ModuleFilterConfigModel): boolean;
/**
 * Drop one field value (column deselected / section clear).
 *
 * @param state - Mutable or immutable state to copy.
 * @param key - {@link FilterFieldModel.key} to clear.
 * @returns Cloned state without that field value.
 */
export declare function clearFilterField(state: FilterStateModel, key: string): FilterStateModel;
/**
 * Reset to empty values while optionally keeping pagination.
 *
 * @param keepPagination - When true, preserve `page` / `size`.
 * @param state - Optional prior state for pagination retention.
 * @returns Empty filter state, optionally retaining pagination.
 */
export declare function resetFilterState(keepPagination?: boolean, state?: FilterStateModel | null): FilterStateModel;
//# sourceMappingURL=filter-serialize.d.ts.map