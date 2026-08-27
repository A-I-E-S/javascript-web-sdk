import {
  DELIVERY_VENDORS,
  EXPORT_DELIVERY_VENDORS,
  isKnownDeliveryVendor,
  normalizeDeliveryVendorForForm,
} from './delivery-vendor.js';

describe('delivery-vendor', () => {
  it('lists the legacy inbound vendor slugs', () => {
    expect(DELIVERY_VENDORS.map((row) => row.id)).toEqual([
      'amazon',
      'dhl',
      'fedex',
      'usps',
      'ups',
      'others',
    ]);
  });

  it('adds walk-in only on export vendor list', () => {
    expect(
      EXPORT_DELIVERY_VENDORS.some((row) => row.id === 'walk-in'),
    ).toBe(true);
    expect(DELIVERY_VENDORS.some((row) => row.id === 'walk-in')).toBe(false);
  });

  it('normalizes known vendors to lowercase ids', () => {
    expect(normalizeDeliveryVendorForForm('FEDEX')).toBe('fedex');
    expect(isKnownDeliveryVendor('fedex')).toBe(true);
  });

  it('keeps unknown stored vendor strings for edit selects', () => {
    expect(normalizeDeliveryVendorForForm('legacy-carrier')).toBe(
      'legacy-carrier',
    );
    expect(isKnownDeliveryVendor('legacy-carrier')).toBe(false);
  });
});
