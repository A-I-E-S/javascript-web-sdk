/**
 * Currency shapes from utility read endpoints.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case). Mapping in `@africanies/africanies-core`
 * preserves those keys.
 */

/**
 * Pivot linking a currency to a payment method (either nested direction).
 */
export interface CurrencyPaymentMethodPivotModel {
  /** Currency id on the join. */
  currency_id: number;

  /** Payment method id on the join. */
  payment_method_id: number;
}

/**
 * Payment processor attached to a {@link CurrencyModel}.
 */
export interface CurrencyPaymentMethodModel {
  /** Numeric payment-method id. */
  id: number;

  /** Display name (e.g. `"Paystack"`, `"Stripe"`). */
  name: string;

  /** Backend model class path (e.g. `"App\\Models\\Stripe"`). */
  model: string;

  /** Whether the method is available. */
  active: boolean;

  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;

  /** Join keys for this currency. */
  pivot: CurrencyPaymentMethodPivotModel;
}

/**
 * Currency record from `GET /currency/read/{id|all}`.
 *
 * `division_rate` / `multiplication_rate` stay strings as on the wire
 * (e.g. `"1"`, `"1400"`).
 */
export interface CurrencyModel {
  /** Numeric currency id from the API. */
  id: number;

  /** Display name (e.g. `"Naira"`, `"US Dollars"`). */
  name: string;

  /** ISO-style code (e.g. `"NGN"`, `"USD"`). */
  short_code: string;

  /** Wire rate string used when converting from this currency. */
  division_rate: string;

  /** Wire rate string used when converting to this currency. */
  multiplication_rate: string;

  /** Whether the local currency is greater than this unit (GET alias). */
  is_local_currency_greater: boolean;

  /**
   * Same flag as {@link CurrencyModel.is_local_currency_greater}.
   * App Settings create/update send this key (`"1"` / `"0"` on the wire).
   */
  is_naira_greater: boolean;

  /** Whether the currency is available for checkout. */
  active: boolean;

  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;

  /** Processors that accept this currency. */
  payment_methods: CurrencyPaymentMethodModel[];
}

/** `"1"` / `"0"` flag as sent on currency create/update. */
export type CurrencyFlag01 = '0' | '1';

/**
 * Request body for `POST /currency/create` (App Settings → Currencies).
 *
 * `name` / `short_code` come from the host’s local currency list, not GET.
 * The SDK serializes `active` / `is_naira_greater` to `"1"` / `"0"`.
 */
export interface CurrencyCreateRequestModel {
  name: string;
  short_code: string;
  multiplication_rate: string;
  division_rate: string;
  /** Boolean or wire `"1"` / `"0"`. */
  active: boolean | CurrencyFlag01;
  /** Boolean or wire `"1"` / `"0"`. */
  is_naira_greater: boolean | CurrencyFlag01;
  payment_method_ids: number[];
}

/**
 * Request body for `PUT /currency/update`. Name and short code are not sent.
 */
export interface CurrencyUpdateRequestModel {
  id: number;
  multiplication_rate: string;
  division_rate: string;
  active: boolean | CurrencyFlag01;
  is_naira_greater: boolean | CurrencyFlag01;
  payment_method_ids: number[];
}

/**
 * Identifier for `DELETE /currency/delete` (JSON body `{ id }`).
 */
export interface CurrencyDeleteRequestModel {
  id: number;
}
