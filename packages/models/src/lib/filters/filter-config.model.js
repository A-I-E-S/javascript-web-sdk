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
};
/** Default when {@link ModuleFilterConfigModel.transport} is omitted. */
export const DEFAULT_FILTER_TRANSPORT = FilterTransport.LegacyParallel;
/**
 * Resolved transport for a module config (defaults to {@link DEFAULT_FILTER_TRANSPORT}).
 * @param config
 */
export function resolveFilterTransport(config) {
    return config.transport ?? DEFAULT_FILTER_TRANSPORT;
}
//# sourceMappingURL=filter-config.model.js.map