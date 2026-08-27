/**
 * Field-level validation or business-rule error returned inside an API envelope.
 *
 * Laravel-style bags (`{ name: ["…"], value: ["…"] }` in `errors` or failure
 * `data`) are normalized by the SDK into this array. Prefer `errors` for forms
 * (`fieldErrorsMap`) and joined `message` / `formatApiErrorMessage` for toasts —
 * the wire top-level `message` alone is often only the first field.
 */
export interface ApiErrorDetailModel {
  field: string | null;
  message: string;
  code: string | null;
}

/**
 * Pagination metadata accompanying list responses.
 *
 * Field names match the wire (snake_case).
 */
export interface PaginationMetaModel {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

/**
 * Canonical API response envelope normalized by the SDK HTTP client.
 *
 * Every field is explicitly `| null` (never optional/undefined) so consumers
 * can rely on null-checks regardless of which subset the backend included.
 * Field names match the wire where the backend embeds them (`status_code`).
 *
 * @typeParam T - Shape of the successful payload in `data`.
 */
export interface ApiResponseModel<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: ApiErrorDetailModel[] | null;
  pagination: PaginationMetaModel | null;
  /** Application-level status when the body includes `status_code`. */
  status_code: number | null;
}
