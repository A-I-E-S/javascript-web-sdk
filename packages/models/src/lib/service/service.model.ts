/**
 * Subscription / add-on service shapes from public utility reads.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Service catalog record from `GET /public/service/read/{id|all}`.
 *
 * Used in App Settings for Services, Plans, and Plan Packages boards.
 * Authenticated create/update/delete use `api/service/*`.
 */
export interface ServiceModel {
  id: number;
  name: string;
  /** Optional marketing / admin description when the wire includes it. */
  description: string | null;
  /** Backend Eloquent class (e.g. `"App\\Models\\SomeService"`). */
  model: string;
  active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}
