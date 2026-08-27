/**
 * Auth request shapes (`POST /auth/…`).
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Request body for `POST /auth/forgot/password`.
 *
 * Email-only: the backend emails a reset link. This frontend does **not**
 * collect a new password for that link (no token in the route).
 *
 * Response `data` is typically an empty array — branch on `success` /
 * `message`. The same body is used from login *and* from admin user/partner
 * screens that send a reset for someone else's email.
 */
export interface ForgotPasswordRequestModel {
  /** Registered account email that should receive the reset link. */
  email: string;
}

