import type { ModuleFilterConfigModel } from '../filter-config.model.js';
/**
 * Track shipments — payment / shipment status chips + tracking number.
 * Transport: legacy `filterColumn` / `filterValue`.
 */
export declare const trackShipmentsFilterConfig: ModuleFilterConfigModel;
/**
 * Update shipments — richest legacy filter set (enums + entity selects + booleans).
 */
export declare const updateShipmentsFilterConfig: ModuleFilterConfigModel;
/**
 * Users (customer list) — performed_action chips + user type select.
 */
export declare const usersFilterConfig: ModuleFilterConfigModel;
/**
 * Named-transport example — newer endpoints with direct query keys.
 */
export declare const shipmentTrackingItemFilterConfig: ModuleFilterConfigModel;
/** Seed registry — look up config by module id. */
export declare const FILTER_CONFIGS: {
    readonly 'track-shipments': ModuleFilterConfigModel;
    readonly 'update-shipments': ModuleFilterConfigModel;
    readonly users: ModuleFilterConfigModel;
    readonly 'shipment-tracking-item-list': ModuleFilterConfigModel;
};
/** Module ids present in {@link FILTER_CONFIGS}. */
export type FilterConfigId = keyof typeof FILTER_CONFIGS;
//# sourceMappingURL=seed-configs.d.ts.map