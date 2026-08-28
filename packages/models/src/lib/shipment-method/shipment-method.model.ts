import type { ShippingMode } from '../shipping/shipping-mode.model.js';

/**
 * Shipment method (carrier) shapes from utility read endpoints.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case), including nested `zone_values`.
 */

/**
 * Geographic zone nested under a method↔zone link.
 */
export interface ShipmentZoneModel {
  id: number;
  name: string;
  type: string;
  active: boolean;
}

/**
 * Link row tying a shipment method to a {@link ShipmentZoneModel}.
 */
export interface ShipmentMethodZoneLinkModel {
  id: number;
  zone_id: number;
  shipment_method_id: number;
  active: boolean;
  mode: ShippingMode;
  zone: ShipmentZoneModel | null;
}

/**
 * One Laravel-style page of zone links embedded on a method payload
 * (`zone_values` on the wire).
 */
export interface ShipmentMethodZonePageModel {
  /** Rows on this page (wire key `data`). */
  data: ShipmentMethodZoneLinkModel[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Carrier / shipment method from `GET /shipment_method/read/{id|all}`.
 */
export interface ShipmentMethodModel {
  id: number;
  name: string;
  slug: string;
  model: string;
  min_delivery_business_day: number;
  max_delivery_business_day: number;
  notes: string;
  blacklisted_words: string | null;
  position: number;
  min_weight: number;
  max_weight: number;
  max_length: number;
  max_width: number;
  max_height: number;
  markup: number;
  surcharge: number;
  insurance_benchmark: number;
  insurance: number;
  clearing_handling: number;
  destination: string;
  /** Whether the method is sea-only (wire `"yes"` / `"no"`). */
  sea_only: boolean;
  currency: string;
  type: string;
  active: boolean;
  multiple_rates: boolean;
  first_shipment_discount: number;
  discount_type: string;
  discount_active: boolean;
  mode: ShippingMode;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  markdown: number;
  zone_values: ShipmentMethodZonePageModel;
}
