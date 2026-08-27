/**
 * Country and subdivision shapes from public utility endpoints.
 *
 * Domain interfaces in `@africanies/africanies-models` use a `*Model` suffix.
 * Field names match the wire (snake_case). Mapping in `@africanies/africanies-core`
 * preserves those keys.
 */

/**
 * State / province / region under a {@link CountryModel}.
 */
export interface CountryStateModel {
  /** Display name (e.g. `"Lagos"`, `"California"`). */
  name: string;

  /** Subdivision code (e.g. `"LA"`, `"CA"`). */
  state_code: string;
}

/**
 * Country record from `GET /public/country/read/{id|all}`.
 */
export interface CountryModel {
  /** Numeric country id from the API. */
  id: number;

  /** Official / display country name. */
  name: string;

  /** ISO 3166-1 alpha-3 code (e.g. `"NGA"`). */
  iso3: string;

  /** ISO 3166-1 alpha-2 code (e.g. `"NG"`). */
  iso2: string;

  /** Nested subdivisions; may be an empty array. */
  states: CountryStateModel[];
}
