/**
 * Resource identifier convention for AFRICANIES list/detail GET endpoints
 * on paths shaped like `/{basePath}/{id?}`.
 *
 * Applies to **all** list-style GETs (built-in SDK services and custom
 * `ApiClient.getResource*` / `buildResourcePath` calls):
 *
 * | Value | Meaning | Path | Pagination |
 * |-------|---------|------|------------|
 * | `null` | Paginated page (SDK default {@link DEFAULT_PAGE_SIZE} `15` unless overridden) | `{basePath}` | `page` / `size` / `order` apply |
 * | `'all'` | Full dump, not paginated | `{basePath}/all` | ignored |
 * | `number` | Single matching record | `{basePath}/{id}` | ignored |
 *
 * Prefer typed helpers when calling custom endpoints:
 * `getResourcePage`, `getResourceAll`, `getResourceById`, or overloads on
 * `getResource(basePath, id, query?)`.
 *
 * @example
 * ```ts
 * const pageId: ResourceId = null;  // GET /widgets?page=1
 * const allId: ResourceId = 'all';  // GET /widgets/all
 * const oneId: ResourceId = 42;     // GET /widgets/42
 * ```
 */
export type ResourceId = number | 'all' | null;

/**
 * Optional query parameters for paginated resource list requests.
 *
 * Fields are optional (not `| null`) because omitted query params mean
 * "use the backend default" — distinct from sending an explicit null body field.
 */
export interface PaginationQueryParamsModel {
  /**
   * 1-based page index to request.
   * Omitted when the caller accepts the backend's default page.
   */
  page?: number;

  /**
   * Page size override. SDK paginated calls default to
   * {@link DEFAULT_PAGE_SIZE} (`15`) when omitted. Allowed UI sizes:
   * {@link PAGINATION_PAGE_SIZES} (`5`, `15`, `30`).
   */
  size?: number;

  /**
   * Sort / order expression understood by the target endpoint.
   * Omitted when default ordering is acceptable.
   */
  order?: string;
}
