/**
 * Subscription plan shapes from public utility reads.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Line item under a {@link PlanModel} (dimensions, discounts, pricing tiers).
 */
export interface PlanPackageModel {
  id: number;
  plan_id: number | null;
  company_service_id: number | null;
  name: string;
  metrics: string | null;
  volume: number | null;
  discount: string | null;
  model: string | null;
  monthly: string | null;
  quarterly: string | null;
  biannually: string | null;
  annually: string | null;
  active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Plan catalog record from `GET /public/plan/read/{id|all}`.
 *
 * Used in App Settings for Plans and Plan Packages. Authenticated writes use
 * `api/plan/*`. Nested {@link PlanPackageModel} rows appear when the wire
 * includes `packages`.
 */
export interface PlanModel {
  id: number;
  name: string;
  active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  packages: PlanPackageModel[];
}
