/**
 * Hardcoded inbound delivery vendor slugs — same values as legacy portal forms (no API).
 */
export declare const DELIVERY_VENDORS: readonly [{
    readonly id: "amazon";
    readonly name: "Amazon";
}, {
    readonly id: "dhl";
    readonly name: "DHL";
}, {
    readonly id: "fedex";
    readonly name: "FedEx";
}, {
    readonly id: "usps";
    readonly name: "USPS";
}, {
    readonly id: "ups";
    readonly name: "UPS";
}, {
    readonly id: "others";
    readonly name: "Others";
}];
/**
 *
 */
export type DeliveryVendorId = (typeof DELIVERY_VENDORS)[number]['id'];
/** Export box editor only — not used on inbound receive/edit forms. */
export declare const EXPORT_DELIVERY_VENDORS: readonly [{
    readonly id: "amazon";
    readonly name: "Amazon";
}, {
    readonly id: "dhl";
    readonly name: "DHL";
}, {
    readonly id: "fedex";
    readonly name: "FedEx";
}, {
    readonly id: "usps";
    readonly name: "USPS";
}, {
    readonly id: "ups";
    readonly name: "UPS";
}, {
    readonly id: "others";
    readonly name: "Others";
}, {
    readonly id: "walk-in";
    readonly name: "Walk-In";
}];
/**
 *
 */
export type ExportDeliveryVendorId = (typeof EXPORT_DELIVERY_VENDORS)[number]['id'];
/** @deprecated Prefer {@link DELIVERY_VENDORS}. */
export declare const DELIVERY_VENDOR_OPTIONS: {
    value: "amazon" | "dhl" | "fedex" | "usps" | "ups" | "others";
    label: "Amazon" | "DHL" | "FedEx" | "USPS" | "UPS" | "Others";
}[];
/** @deprecated Prefer {@link EXPORT_DELIVERY_VENDORS}. */
export declare const BOX_DELIVERY_VENDORS: readonly [{
    readonly id: "amazon";
    readonly name: "Amazon";
}, {
    readonly id: "dhl";
    readonly name: "DHL";
}, {
    readonly id: "fedex";
    readonly name: "FedEx";
}, {
    readonly id: "usps";
    readonly name: "USPS";
}, {
    readonly id: "ups";
    readonly name: "UPS";
}, {
    readonly id: "others";
    readonly name: "Others";
}, {
    readonly id: "walk-in";
    readonly name: "Walk-In";
}];
/** @deprecated Prefer {@link ExportDeliveryVendorId}. */
export type BoxDeliveryVendorId = ExportDeliveryVendorId;
/**
 *
 * @param value
 */
export declare function normalizeDeliveryVendor(value: string): string;
/**
 *
 * @param value
 */
export declare function isKnownDeliveryVendor(value: string | null | undefined): boolean;
/**
 * Lowercase known ids; keep raw string for legacy/custom stored values.
 * @param value
 */
export declare function normalizeDeliveryVendorForForm(value: string | null | undefined): string;
/**
 *
 * @param value
 */
export declare function deliveryVendorLabel(value: string): string;
//# sourceMappingURL=delivery-vendor.d.ts.map