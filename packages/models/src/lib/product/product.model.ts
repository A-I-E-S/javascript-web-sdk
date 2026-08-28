import type { ApiJsonValue } from '../api/api-json.model.js';

/**
 * Product shapes from utility read endpoints.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Product record from `GET /product/read/{id|all}`.
 *
 * Includes HS codes, document/ETW id lists, and human-readable document
 * labels. `zone_product_required_documents` stays an opaque JSON list until
 * a dedicated nested model is needed.
 */
export interface ProductModel {
  id: number;
  account_id: number | null;
  product_category_id: number | null;
  hs_code: string;
  hs_code_10: string | null;
  hs_code_8: string | null;
  hs_code_6: string | null;
  name: string;
  value: number;
  usage: number;
  document_ids: number[] | null;
  etw_ids: number[] | null;
  active: boolean;
  is_external: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Display labels for required documents (e.g. `"Fumigation Certificate"`). */
  document_details: string[];
  /** Display labels for ETW documents (e.g. `"FDA Certificate"`). */
  etw_document_details: string[];
  /**
   * Zone-scoped required document payloads when present (null-safe JSON tree).
   */
  zone_product_required_documents: ApiJsonValue[];
}
