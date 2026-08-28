/**
 * Authenticated user shapes from `GET /user`.
 *
 * Field names match the wire (snake_case). Most properties are optional /
 * nullable so Customer and Admin payloads can share one type safely.
 *
 * The wire body is a bare user object (no `{ success, data }` envelope).
 * {@link ApiClient} still wraps it in {@link ApiResponseModel}; mapping in
 * `@africanies/africanies-core` preserves snake_case and fills nested models.
 */

/** Backend Eloquent class for the authenticated principal. */
export type UserModelType = 'App\\Models\\Customer' | 'App\\Models\\Admin';

/** Account classification on the user / business account. */
export type AccountType = 'business' | 'individual';

/** Preferred shipping flow. */
export type ShippingType = 'instant' | 'consolidation';

/** Billing cadence on plans / subscriptions. */
export type PlanType = 'monthly' | 'quarterly' | 'biannually' | 'annually';

/**
 * Subdivision entry under {@link UserCountryModel.states}.
 */
export interface UserStateModel {
  name?: string | null;
  state_code?: string | null;
}

/**
 * Country nested on the user profile (lighter than the public country utility).
 */
export interface UserCountryModel {
  id?: number | null;
  name?: string | null;
  iso3?: string | null;
  iso2?: string | null;
  states?: UserStateModel[] | null;
}

/**
 * Line item under a subscription {@link UserPlanModel} (dimensions, discounts,
 * perks — values are often stringified numbers or descriptive text).
 */
export interface UserPlanPackageModel {
  id?: number | null;
  plan_id?: number | null;
  company_service_id?: number | null;
  name?: string | null;
  metrics?: string | null;
  volume?: number | null;
  discount?: string | null;
  model?: string | null;
  monthly?: string | null;
  quarterly?: string | null;
  biannually?: string | null;
  annually?: string | null;
  active?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Subscription plan attached to a business account.
 */
export interface UserPlanModel {
  id?: number | null;
  name?: string | null;
  active?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  packages?: UserPlanPackageModel[] | null;
}

/**
 * Payment gateway redirect payload (often nested under payment_payload JSON).
 */
export interface UserGatewayPayloadModel {
  authorization_url?: string | null;
  access_code?: string | null;
  reference?: string | null;
  redirect_url?: string | null;
}

/**
 * Parsed payment redirect / checkout payload.
 */
export interface UserPaymentPayloadModel {
  url?: string | null;
  redirect_url?: string | null;
  gateway_payload?: UserGatewayPayloadModel | null;
  reference?: string | null;
}

/**
 * Subscription row on a business account.
 *
 * `payment_payload` is a raw JSON string on the wire — parse with
 * `JSON.parse` into {@link UserPaymentPayloadModel} when needed.
 */
export interface UserSubscriptionModel {
  id?: number | null;
  user_id?: number | null;
  plan_id?: number | null;
  account_id?: number | null;
  reference?: string | null;
  process_url?: string | null;
  reference_salt?: string | null;
  amount?: string | null;
  /** e.g. `"NGN"`. */
  currency?: string | null;
  payment_amount?: string | null;
  payment_currency?: string | null;
  coupon_id?: number | null;
  coupon_discount?: string | null;
  coupon_amount?: string | null;
  /** Raw JSON string — parse to {@link UserPaymentPayloadModel}. */
  payment_payload?: string | null;
  plan_type?: PlanType | null;
  used?: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * Business account nested under the user when present.
 */
export interface UserBusinessAccountModel {
  id?: number | null;
  user_id?: number | null;
  plan_id?: number | null;
  name?: string | null;
  account_email?: string | null;
  plan_type?: PlanType | null;
  first_payment?: boolean | null;
  is_whitelisted?: boolean | null;
  no_state_validation?: boolean | null;
  show_waybill?: boolean | null;
  notify_api_shipment?: boolean | null;
  active?: boolean | null;
  expires_at?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  type?: AccountType | null;
  days_left?: number | null;
  plan?: UserPlanModel | null;
  subscription?: UserSubscriptionModel | null;
}

/**
 * Assigned account manager when present.
 */
export interface UserAccountManagerModel {
  id?: number | null;
  user_id?: number | null;
  manager_id?: number | null;
  account_id?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

/**
 * Current user from `GET /user` (auth required).
 *
 * Covers Customer and Admin wire variants; omit or null fields as the API
 * omits them.
 */
export interface UserModel {
  id?: number | null;
  central_id?: string | null;
  name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  unit_number?: string | null;
  referral_code?: string | null;
  old_unit_number?: string | null;
  account_email?: string | null;
  two_factor?: boolean | null;
  default_pin?: boolean | null;
  model?: UserModelType | null;
  country?: UserCountryModel | null;
  /** Selected state label when the API returns a string. */
  state?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  kyc_verified_at?: string | null;
  passport_verified_at?: string | null;
  suspended_at?: string | null;
  deactivated_at?: string | null;
  active?: boolean | null;
  /**
   * When true after login, send the user to `/onboarding/reset-password`
   * (change current → new via `POST /user/change/password`). Not the
   * email-link forgot-password flow.
   */
  default_password?: boolean | null;
  type?: AccountType | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
  socialite_signup?: 0 | 1 | null;
  form_signup?: 0 | 1 | null;
  /** e.g. `"ng"`. */
  main_region?: string | null;
  shipping_type?: ShippingType | null;
  /** Shape TBD when the API populates this list. */
  accounts?: unknown[] | null;
  business_account?: UserBusinessAccountModel | null;
  account_manager?: UserAccountManagerModel | null;
}

/**
 * Request body for `POST /user/change/password`.
 *
 * First login with a default password (`user.default_password`) — not the
 * email-link forgot-password flow. Host apps typically land on
 * `/onboarding/reset-password`, then the dashboard.
 */
export interface ChangePasswordRequestModel {
  /** Password the user signed in with (the default / current password). */
  current_password: string;
  /** Replacement password. */
  password: string;
  /** Must match {@link ChangePasswordRequestModel.password}. */
  password_confirmation: string;
}
