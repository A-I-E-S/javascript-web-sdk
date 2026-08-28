/**
 * UI-facing async query snapshot for wrappers such as AsyncStateComponent.
 *
 * Mirrors the signals typically exposed by TanStack Query's `injectQuery()`
 * so apps can map query results into one object without coupling the UI
 * package to TanStack itself.
 *
 * @typeParam T - Successful data shape when a fetch has produced a value.
 *
 * @example
 * ```ts
 * // Map injectQuery() signals into AsyncQueryStateModel for <africanies-async-state>
 * const state: AsyncQueryStateModel<Widget[]> = {
 *   data: query.data(),
 *   isLoading: query.isLoading(),
 *   isFetching: query.isFetching(),
 *   isError: query.isError(),
 *   error: query.error()?.message ?? null,
 * };
 * ```
 */
export interface AsyncQueryStateModel<T> {
  /**
   * Latest successful data, if any.
   * `undefined` before the first successful fetch (and often while `isLoading`).
   * Uses `undefined` (not `null`) to align with TanStack Query's empty-data sentinel.
   */
  data: T | undefined;

  /**
   * `true` only on the initial fetch before any data exists.
   * Distinguishes blocking first-load from background refetch (`isFetching`).
   */
  isLoading: boolean;

  /**
   * `true` whenever any fetch is in flight, including background refetches.
   * May be true while `data` is still present from a prior success.
   */
  isFetching: boolean;

  /**
   * `true` if the most recent fetch attempt failed.
   * Can be true with stale `data` still available after a background error.
   */
  isError: boolean;

  /**
   * Human-readable error message for the latest failure.
   * `null` when `isError` is false or no message is available.
   */
  error: string | null;
}
