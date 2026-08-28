/**
 * Deep JSON value with no `undefined` — every key/slot is present as
 * {@link ApiJsonValue} (use `null` for missing nested values).
 *
 * Used for opaque API blobs (partner, accounts, …) until dedicated *Model
 * types exist. Prefer typed models when the wire schema is stable.
 */

/** JSON primitive including explicit `null`. */
export type ApiJsonPrimitive = string | number | boolean | null;

/**
 * Plain object whose values are recursively {@link ApiJsonValue}
 * (never `undefined`).
 */
export interface ApiJsonObjectModel {
  readonly [key: string]: ApiJsonValue;
}

/**
 * Null-safe JSON tree for untyped API subtrees.
 */
export type ApiJsonValue =
  | ApiJsonPrimitive
  | readonly ApiJsonValue[]
  | ApiJsonObjectModel;
