/**
 * Allowed page sizes for list pagination (`size` query param).
 */
export declare const PAGINATION_PAGE_SIZES: readonly [5, 15, 30];
/** One of {@link PAGINATION_PAGE_SIZES}. */
export type PaginationPageSize = (typeof PAGINATION_PAGE_SIZES)[number];
/** Default `size` on paginated resource GETs. */
export declare const DEFAULT_PAGE_SIZE: PaginationPageSize;
/** Inbox / notification list page size. */
export declare const NOTIFICATION_PAGE_SIZE: PaginationPageSize;
//# sourceMappingURL=pagination.d.ts.map