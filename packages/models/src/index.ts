/** Public entry point for framework-independent AFRICANIES data contracts. */
export const MODELS_PACKAGE_NAME = '@africanies/africanies-models';

export * from './lib/api/index.js';
export * from './lib/async/index.js';
export * from './lib/auth/index.js';
export * from './lib/country/index.js';
export * from './lib/currency/index.js';
export * from './lib/delivery-vendor/index.js';
export * from './lib/document/index.js';
export * from './lib/file/index.js';
export * from './lib/filters/index.js';
export * from './lib/mode/index.js';
export * from './lib/notification/index.js';
export * from './lib/payment-method/index.js';
export * from './lib/plan/index.js';
export * from './lib/product/index.js';
export * from './lib/service/index.js';
export * from './lib/shipment-method/index.js';
export * from './lib/shipping/index.js';
export * from './lib/user/index.js';
export * from './lib/warehouse/index.js';
export * from './lib/zone/index.js';

// Explicit type forwarding keeps the framework-independent declaration surface
// auditable without turning erased Angular interfaces into runtime shims.
export type {
  ApiErrorDetailModel,
  ApiJsonObjectModel,
  ApiJsonPrimitive,
  ApiJsonValue,
  ApiResponseModel,
  PaginationMetaModel,
  PaginationPageSize,
  PaginationQueryParamsModel,
  ResourceId,
} from './lib/api/index.js';
export type { AsyncQueryStateModel } from './lib/async/index.js';
export type { ForgotPasswordRequestModel } from './lib/auth/index.js';
export type { CountryModel, CountryStateModel } from './lib/country/index.js';
export type {
  CurrencyCreateRequestModel,
  CurrencyDeleteRequestModel,
  CurrencyFlag01,
  CurrencyModel,
  CurrencyPaymentMethodModel,
  CurrencyPaymentMethodPivotModel,
  CurrencyUpdateRequestModel,
} from './lib/currency/index.js';
export type {
  BoxDeliveryVendorId,
  DeliveryVendorId,
  ExportDeliveryVendorId,
} from './lib/delivery-vendor/index.js';
export type { DocumentModel } from './lib/document/index.js';
export type { FileReadModel, FileReadRequestModel } from './lib/file/index.js';
export type {
  FilterConfigId,
  FilterFieldModel,
  FilterFieldType,
  FilterOptionModel,
  FilterOptionsSource,
  FilterParamsModel,
  FilterQueryBag,
  FilterStateModel,
  ModuleFilterConfigModel,
} from './lib/filters/index.js';
export type {
  ModeAppType,
  ModeConfigDataModel,
  ModeCurrencyCode,
  ModeDimensionUnit,
  ModeMassUnit,
  ModeRegionConfigModel,
  ModeSfnConfigModel,
  ModeStnConfigModel,
} from './lib/mode/index.js';
export type {
  NotificationInboxItemModel,
  NotificationMarkAllReadRequestModel,
  NotificationMarkReadSingleRequestModel,
  NotificationModel,
  NotificationPayloadModel,
} from './lib/notification/index.js';
export type {
  PaymentMethodCurrencyModel,
  PaymentMethodFlag01,
  PaymentMethodModel,
  PaymentMethodUpdateRequestModel,
} from './lib/payment-method/index.js';
export type { PlanModel, PlanPackageModel } from './lib/plan/index.js';
export type { ProductModel } from './lib/product/index.js';
export type { ServiceModel } from './lib/service/index.js';
export type {
  ShipmentMethodModel,
  ShipmentMethodZoneLinkModel,
  ShipmentMethodZonePageModel,
  ShipmentZoneModel,
} from './lib/shipment-method/index.js';
export type { ShippingMode } from './lib/shipping/index.js';
export type {
  AccountType,
  ChangePasswordRequestModel,
  PlanType,
  ShippingType,
  UserAccountManagerModel,
  UserBusinessAccountModel,
  UserCountryModel,
  UserGatewayPayloadModel,
  UserModel,
  UserModelType,
  UserPaymentPayloadModel,
  UserPlanModel,
  UserPlanPackageModel,
  UserStateModel,
  UserSubscriptionModel,
} from './lib/user/index.js';
export type { WarehouseModel, WarehouseStateModel } from './lib/warehouse/index.js';
export type { ZoneModel } from './lib/zone/index.js';

// Keep runtime exports visible at the package boundary for API auditing tools.
export {
  DELIVERY_VENDORS,
  EXPORT_DELIVERY_VENDORS,
  normalizeDeliveryVendorForForm,
} from './lib/delivery-vendor/index.js';
export {
  FilterTransport,
  cloneFilterState,
  emptyFilterState,
  fromFilterParams,
  hasFilterParams,
  toFilterParams,
} from './lib/filters/index.js';
