/**
 * User notification records from authenticated inbox reads.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case).
 */

/**
 * Parsed payload inside {@link NotificationModel.data}.
 *
 * The API stores this object as a JSON string on the wire; the SDK mapper
 * parses it once into this shape.
 */
export interface NotificationPayloadModel {
  /** Related user id when present on the payload. */
  user_id?: number | null;
  /** Primary inbox title. */
  title: string;
  /** Supporting copy. */
  body?: string | null;
  /** In-app or external navigation target when the user opens the item. */
  link?: string | null;
  /** Optional image URL. */
  image?: string | null;
  /** When true, {@link link} should open in a new browsing context. */
  external_link?: boolean | null;
}

/**
 * Database notification row from `GET /user/notifications/read/{id?}`.
 */
export interface NotificationModel {
  /** UUID primary key. */
  id: string;
  /** Laravel notification class name. */
  type: string;
  /** Polymorphic notifiable type (e.g. `App\\Models\\User`). */
  notifiable_type: string;
  /** Polymorphic notifiable id. */
  notifiable_id: number;
  /** Parsed notification payload. */
  data: NotificationPayloadModel;
  /** ISO timestamp when read; `null` when unread. */
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Compact inbox item derived from {@link NotificationModel} for UI headers.
 *
 * Maps cleanly onto {@link AfricaniesNotification} in `@africanies/africanies-ui`.
 */
export interface NotificationInboxItemModel {
  id: string;
  title: string;
  body?: string;
  timestamp?: string;
  read?: boolean;
  link?: string;
  external_link?: boolean;
  image?: string | null;
}

/** Mark one notification read — `PUT /user/notifications/update`. */
export interface NotificationMarkReadSingleRequestModel {
  id: string;
}

/** Mark every notification read — `PUT /user/notifications/update` with `{}`. */
export type NotificationMarkAllReadRequestModel = Record<string, never>;
