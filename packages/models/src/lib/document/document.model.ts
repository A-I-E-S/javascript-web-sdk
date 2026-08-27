/**
 * Document catalog shapes from public utility reads.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

import type { FileReadModel } from '../file/file.model.js';

/**
 * Document record from `GET /public/document/read/{id|all}`.
 *
 * List rows are usually metadata only. `readById(id)` for App Settings /
 * Products / Plans preview populates {@link DocumentModel.file_ref} with
 * `mime_type` and `base_64` (bind `file_ref.base_64` in an `<img>` or PDF viewer).
 *
 * For entities that store a raw `file_ref` string (shipments, KYC, waybills),
 * use {@link FileReadRequestModel} + `POST /file/read` instead.
 * Authenticated upload/delete use `api/document/*`.
 */
export interface DocumentModel {
  id: number;
  name: string;
  description: string | null;
  /** Document type / category label when present on the wire. */
  type: string | null;
  active: boolean;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  /**
   * Nested preview payload on `readById` responses (`file_ref.base_64`).
   * Null on list rows and when the wire omits preview bytes.
   */
  file_ref: FileReadModel | null;
}
