/**
 * Hardcoded inbound delivery vendor slugs — same values as legacy portal forms (no API).
 */

export /**
 *
 */
const DELIVERY_VENDORS = [
  { id: 'amazon', name: 'Amazon' },
  { id: 'dhl', name: 'DHL' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'usps', name: 'USPS' },
  { id: 'ups', name: 'UPS' },
  { id: 'others', name: 'Others' },
] as const;

/**
 *
 */
export type DeliveryVendorId = (typeof DELIVERY_VENDORS)[number]['id'];

/** Export box editor only — not used on inbound receive/edit forms. */
export const EXPORT_DELIVERY_VENDORS = [
  ...DELIVERY_VENDORS,
  { id: 'walk-in', name: 'Walk-In' },
] as const;

/**
 *
 */
export type ExportDeliveryVendorId =
  (typeof EXPORT_DELIVERY_VENDORS)[number]['id'];

/** @deprecated Prefer {@link DELIVERY_VENDORS}. */
export const DELIVERY_VENDOR_OPTIONS = DELIVERY_VENDORS.map((row) => ({
  value: row.id,
  label: row.name,
}));

/** @deprecated Prefer {@link EXPORT_DELIVERY_VENDORS}. */
export const BOX_DELIVERY_VENDORS = EXPORT_DELIVERY_VENDORS;

/** @deprecated Prefer {@link ExportDeliveryVendorId}. */
export type BoxDeliveryVendorId = ExportDeliveryVendorId;

const VENDOR_LABELS = Object.fromEntries(
  DELIVERY_VENDORS.map((row) => [row.id, row.name]),
) as Record<DeliveryVendorId, string>;

/**
 *
 * @param value
 */
export function normalizeDeliveryVendor(value: string): string {
  return value.trim().toLowerCase();
}

/**
 *
 * @param value
 */
export function isKnownDeliveryVendor(
  value: string | null | undefined,
): boolean {
  const normalized = normalizeDeliveryVendor(value ?? '');
  if (!normalized) {
    return false;
  }
  return DELIVERY_VENDORS.some((vendor) => vendor.id === normalized);
}

/**
 * Lowercase known ids; keep raw string for legacy/custom stored values.
 * @param value
 */
export function normalizeDeliveryVendorForForm(
  value: string | null | undefined,
): string {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return '';
  }
  const normalized = normalizeDeliveryVendor(raw);
  if (isKnownDeliveryVendor(normalized)) {
    return normalized;
  }
  return raw;
}

/**
 *
 * @param value
 */
export function deliveryVendorLabel(value: string): string {
  const normalized = normalizeDeliveryVendor(value);
  if (!normalized || normalized === 'others') {
    return '';
  }
  return VENDOR_LABELS[normalized as DeliveryVendorId] ?? value.trim();
}
