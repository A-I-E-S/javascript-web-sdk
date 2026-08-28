/**
 * Product surface / shipment mode for STN vs SFN experiences.
 *
 * Persisted per browser tab (`sessionStorage`) and attached to outbound
 * requests (e.g. `x-shipment-mode` header and `mode` query where required).
 *
 * - `'stn'` — Ship To Nigeria / international inbound flows
 * - `'sfn'` — Ship From Nigeria / outbound flows
 */
export type ShippingMode = 'stn' | 'sfn';
