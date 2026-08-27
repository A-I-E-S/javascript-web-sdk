import type { ApiJsonValue } from '../api/api-json.model.js';
import type { CountryModel } from '../country/country.model.js';

/**
 * Warehouse shapes from utility read endpoints.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Subdivision attached to a warehouse (includes country name/code).
 */
export interface WarehouseStateModel {
  /** State id from the API. */
  id: number;

  /** Display name (e.g. `"Guangdong"`). */
  name: string;

  /** Subdivision code. */
  state_code: string;

  /** Country display name on the wire (e.g. `"China"`). */
  country: string;

  /** ISO 3166-1 alpha-2. */
  country_code: string;
}

/**
 * Warehouse record from `GET /warehouse/read/{id|all}`.
 */
export interface WarehouseModel {
  id: number;
  partner_id: number | null;
  name: string;
  phone: string;
  email: string;
  country: CountryModel | null;
  /** Whether API integrations are enabled (wire `"0"` / `"1"`). */
  api_enabled: boolean;
  state: WarehouseStateModel | null;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  zip_code: string;
  usage: number;
  active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  storage_charge: number;
  storage_period: number;
  delivery_charge: number;
  delivery_count: number;
  currency: string;
  etw_shipment_available: boolean;
  local: boolean;
  no_shippo: boolean;
  /**
   * Nested partner payload when present (null-safe JSON tree).
   */
  partner: ApiJsonValue | null;
}
