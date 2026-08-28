import { FilterTransport, resolveFilterTransport } from './filter-config.model.js';
/**
 * Empty filter state — safe default before hydrate / after reset.
 *
 * Sort defaults to descending (`desc`) so list screens match the usual
 * “newest first” API contract without an explicit Apply.
 *
 * @returns A state with an empty `values` map and `order: 'desc'`.
 */
export function emptyFilterState() {
    return { values: {}, order: 'desc' };
}
/**
 * Clone state so drawer edits do not mutate the host until Apply.
 *
 * @param state - Current filter state (or undefined).
 * @returns A shallow copy safe to mutate in the drawer.
 */
export function cloneFilterState(state) {
    if (state == null) {
        return emptyFilterState();
    }
    return {
        ...(state.search === undefined ? {} : { search: state.search }),
        ...(state.from === undefined ? {} : { from: state.from }),
        ...(state.to === undefined ? {} : { to: state.to }),
        ...(state.date === undefined ? {} : { date: state.date }),
        ...(state.order === undefined ? {} : { order: state.order }),
        ...(state.page === undefined ? {} : { page: state.page }),
        ...(state.size === undefined ? {} : { size: state.size }),
        values: { ...state.values },
    };
}
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
export function toFilterParams(state, config) {
    const params = {};
    if (state.search != null && state.search !== '') {
        params[config.search?.param ?? 'search'] = state.search;
    }
    if (state.from) {
        params[config.date?.rangeParams.from ?? 'from'] = state.from;
    }
    if (state.to) {
        params[config.date?.rangeParams.to ?? 'to'] = state.to;
    }
    if (state.date) {
        params[config.date?.fieldParam ?? 'date'] = state.date;
    }
    if (state.order) {
        params[config.sort?.param ?? 'order'] = state.order;
    }
    if (state.page != null) {
        params[config.pagination?.pageParam ?? 'page'] = state.page;
    }
    if (state.size != null) {
        params[config.pagination?.sizeParam ?? 'size'] = state.size;
    }
    if (resolveFilterTransport(config) === FilterTransport.Named) {
        for (const field of config.fields) {
            const v = state.values[field.key];
            if (v != null && v !== '') {
                params[field.key] = v;
            }
        }
        return params;
    }
    // legacy-parallel — only fields that have a value
    const columns = [];
    const values = [];
    for (const field of config.fields) {
        const v = state.values[field.key];
        if (v === undefined || v === '') {
            continue;
        }
        columns.push(field.key);
        values.push(String(v));
    }
    if (columns.length) {
        params['filterColumn'] = columns.join(',');
        params['filterValue'] = values.join(',');
    }
    return params;
}
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
export function fromFilterParams(params, config) {
    const state = emptyFilterState();
    const read = (key) => queryBagValue(params[key]);
    const search = read(config.search?.param ?? 'search');
    const from = read(config.date?.rangeParams.from ?? 'from');
    const to = read(config.date?.rangeParams.to ?? 'to');
    const date = read(config.date?.fieldParam ?? 'date');
    const order = read(config.sort?.param ?? 'order');
    if (search !== undefined)
        state.search = search;
    if (from !== undefined)
        state.from = from;
    if (to !== undefined)
        state.to = to;
    if (date !== undefined)
        state.date = date;
    if (order !== undefined)
        state.order = order;
    const pageRaw = read(config.pagination?.pageParam ?? 'page');
    const sizeRaw = read(config.pagination?.sizeParam ?? 'size');
    if (pageRaw != null) {
        const n = Number(pageRaw);
        if (!Number.isNaN(n)) {
            state.page = n;
        }
    }
    if (sizeRaw != null) {
        const n = Number(sizeRaw);
        if (!Number.isNaN(n)) {
            state.size = n;
        }
    }
    if (resolveFilterTransport(config) === FilterTransport.Named) {
        for (const field of config.fields) {
            const v = read(field.key);
            if (v != null) {
                state.values[field.key] = v;
            }
        }
        return state;
    }
    const columns = (read('filterColumn') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const values = (read('filterValue') ?? '')
        .split(',')
        .map((s) => s.trim());
    columns.forEach((key, i) => {
        const v = values[i];
        if (v != null && v !== '') {
            state.values[key] = v;
        }
    });
    return state;
}
/**
 * Query keys this config reads and writes (`search`, `page`, `size`, field
 * keys or `filterColumn` / `filterValue`, etc.).
 *
 * @param config - Module schema.
 * @returns Deduped list of query param names.
 */
export function filterQueryKeys(config) {
    const keys = [
        config.search?.param ?? 'search',
        config.date?.rangeParams.from ?? 'from',
        config.date?.rangeParams.to ?? 'to',
        config.date?.fieldParam ?? 'date',
        config.sort?.param ?? 'order',
        config.pagination?.pageParam ?? 'page',
        config.pagination?.sizeParam ?? 'size',
    ];
    if (resolveFilterTransport(config) === FilterTransport.Named) {
        keys.push(...config.fields.map((field) => field.key));
    }
    else {
        keys.push('filterColumn', 'filterValue');
    }
    return [...new Set(keys)];
}
/**
 * True when the bag contains any list-filter / pagination key this config
 * understands. Used to decide whether to hydrate from the URL.
 *
 * @param params - Router query params or API query object.
 * @param config - Module schema.
 * @returns Whether at least one relevant non-empty param is present.
 */
export function hasFilterParams(params, config) {
    return filterQueryKeys(config).some((key) => queryBagValue(params[key]) != null);
}
/**
 * @param raw - One query-bag value.
 * @returns First non-empty string, or undefined.
 */
function queryBagValue(raw) {
    if (raw == null) {
        return undefined;
    }
    if (Array.isArray(raw)) {
        return raw[0] != null && String(raw[0]) !== '' ? String(raw[0]) : undefined;
    }
    const value = String(raw);
    return value === '' ? undefined : value;
}
/**
 * Drop one field value (column deselected / section clear).
 *
 * @param state - Mutable or immutable state to copy.
 * @param key - {@link FilterFieldModel.key} to clear.
 * @returns Cloned state without that field value.
 */
export function clearFilterField(state, key) {
    const next = cloneFilterState(state);
    delete next.values[key];
    return next;
}
/**
 * Reset to empty values while optionally keeping pagination.
 *
 * @param keepPagination - When true, preserve `page` / `size`.
 * @param state - Optional prior state for pagination retention.
 * @returns Empty filter state, optionally retaining pagination.
 */
export function resetFilterState(keepPagination = false, state) {
    const next = emptyFilterState();
    if (keepPagination && state) {
        if (state.page !== undefined)
            next.page = state.page;
        if (state.size !== undefined)
            next.size = state.size;
    }
    return next;
}
//# sourceMappingURL=filter-serialize.js.map