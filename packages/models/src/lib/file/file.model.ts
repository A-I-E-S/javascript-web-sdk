/**
 * File read shapes from `POST /file/read`.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Request body for {@link FileReadModel} fetches.
 */
export interface FileReadRequestModel {
  /** Storage / document reference UUID. */
  ref: string;
}

/**
 * One file payload from `POST /file/read`.
 *
 * Response `data` is this object (not a list). Prefer {@link FileReadModel.url}
 * for downloads when the signed URL is present; `base_64` is typically a data
 * URI (`data:{mime};base64,…`).
 */
export interface FileReadModel {
  /** MIME type (e.g. `"application/pdf"`). */
  mime_type: string;

  /**
   * Inline file bytes as a data URI or raw base64 string.
   * Can be large — avoid logging or binding the full value in UI lists.
   */
  base_64: string;

  /** Time-limited signed URL for the object (when provided). */
  url: string;
}
