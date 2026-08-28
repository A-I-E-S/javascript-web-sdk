/**
 * Allowed page sizes for list pagination (`size` query param).
 */
export const PAGINATION_PAGE_SIZES = [5, 15, 30] as const;

/** One of {@link PAGINATION_PAGE_SIZES}. */
export type PaginationPageSize = (typeof PAGINATION_PAGE_SIZES)[number];

/** Default `size` on paginated resource GETs. */
export const DEFAULT_PAGE_SIZE: PaginationPageSize = 15;

/** Inbox / notification list page size. */
export const NOTIFICATION_PAGE_SIZE: PaginationPageSize = 30;
