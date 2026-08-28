/**
 * Zone shapes from utility read endpoints.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Zone record from `GET /zone/read/records/{id|all}`.
 */
export interface ZoneModel {
  id: number;
  name: string;
  /** Zone type from the API (e.g. `"standard"`, `"default"`). */
  type: string;
  active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}
