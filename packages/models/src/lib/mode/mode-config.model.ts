import type { ShippingMode } from '../shipping/shipping-mode.model.js';

/**
 * Linear dimension unit used when displaying or validating package sizes.
 */
export type ModeDimensionUnit = 'cm' | 'inches';

/**
 * Mass unit used when displaying or validating package weight.
 */
export type ModeMassUnit = 'KG' | 'LBS';

/**
 * Supported currency codes for mode/region pricing display.
 */
export type ModeCurrencyCode = 'NGN' | 'USD';

/**
 * App-type selector when resolving region config.
 */
export type ModeAppType = ShippingMode;

/**
 * Region-specific display units and currency for a shipping mode.
 *
 * Field names match the wire (snake_case).
 */
export interface ModeRegionConfigModel {
  dimension_unit: ModeDimensionUnit;
  mass_unit: ModeMassUnit;
  currency: ModeCurrencyCode;
  currency_symbol: string;
}

/**
 * Region map for Ship-From-Nigeria (`sfn`) mode.
 */
export interface ModeSfnConfigModel {
  default: ModeRegionConfigModel;
  ng: ModeRegionConfigModel;
}

/**
 * Region map for Ship-To-Nigeria (`stn`) mode.
 */
export interface ModeStnConfigModel {
  default: ModeRegionConfigModel;
  us: ModeRegionConfigModel;
  cn: ModeRegionConfigModel;
  gb: ModeRegionConfigModel;
}

/**
 * Full public mode-config payload from `/public/mode/config`.
 */
export interface ModeConfigDataModel {
  sfn: ModeSfnConfigModel;
  stn: ModeStnConfigModel;
}
