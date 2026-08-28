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
export {};
//# sourceMappingURL=user.model.js.map