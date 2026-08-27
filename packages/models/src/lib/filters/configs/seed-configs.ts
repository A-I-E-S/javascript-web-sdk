import type { ModuleFilterConfigModel } from '../filter-config.model.js';
import { FilterTransport } from '../filter-config.model.js';

/**
 * Track shipments — payment / shipment status chips + tracking number.
 * Transport: legacy `filterColumn` / `filterValue`.
 */
export const trackShipmentsFilterConfig: ModuleFilterConfigModel = {
  id: 'track-shipments',
  route: ['portal', 'shipment', 'track-shipments'],
  transport: 'legacy-parallel',
  pagination: { pageParam: 'page', sizeParam: 'size' },
  search: {
    param: 'search',
    label: 'Shipment ID',
    placeholder: 'Search',
  },
  date: {
    rangeParams: { from: 'from', to: 'to' },
    fieldParam: 'date',
    fields: [{ value: 'created_at', label: 'Date Created' }],
  },
  sort: {
    param: 'order',
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
  },
  fields: [
    {
      key: 'payment_status',
      label: 'Payment Status',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'paid', label: 'Paid', color: '#25945c' },
        { value: 'unpaid', label: 'Unpaid', color: '#f48220' },
      ],
    },
    {
      key: 'shipment_status',
      label: 'Shipment Status',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'pending', label: 'Pending', color: '#DBB316' },
        { value: 'in-process', label: 'In Process', color: '#3B82F6' },
        { value: 'completed', label: 'Completed', color: '#25945c' },
      ],
    },
    {
      key: 'tracking_number',
      label: 'Tracking Number',
      type: 'text',
      placeholder: 'Search',
    },
  ],
};

/**
 * Update shipments — richest legacy filter set (enums + entity selects + booleans).
 */
export const updateShipmentsFilterConfig: ModuleFilterConfigModel = {
  id: 'update-shipments',
  route: ['portal', 'shipment', 'update-shipments'],
  transport: 'legacy-parallel',
  pagination: { pageParam: 'page', sizeParam: 'size' },
  search: {
    param: 'search',
    label: 'Shipment ID',
    placeholder: 'Search',
  },
  date: {
    rangeParams: { from: 'from', to: 'to' },
    fieldParam: 'date',
    fields: [
      { value: 'created_at', label: 'Date Created' },
      { value: 'paid_at', label: 'Date of Payment' },
      { value: 'packaged_at', label: 'Date Packaged' },
      { value: 'shipment_processed_at', label: 'Date Processed' },
    ],
  },
  sort: {
    param: 'order',
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
  },
  fields: [
    {
      key: 'payment_status',
      label: 'Payment Status',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'paid', label: 'Paid', color: '#25945c' },
        { value: 'unpaid', label: 'Unpaid', color: '#f48220' },
      ],
    },
    {
      key: 'shipment_status',
      label: 'Shipment Status',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'pending', label: 'Pending', color: '#DBB316' },
        { value: 'in-process', label: 'In Process', color: '#3B82F6' },
        { value: 'completed', label: 'Completed', color: '#25945c' },
      ],
    },
    {
      key: 'type',
      label: 'Shipment Type',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'shipment', label: 'Shipment', color: '#3B82F6' },
        { value: 'etw_shipment', label: 'ETW Shipment', color: '#8B5CF6' },
      ],
    },
    {
      key: 'shipment_method_id',
      label: 'Shipment Carrier',
      type: 'select',
      optionsSource: 'shipmentMethods',
      placeholder: 'Shipment Methods',
    },
    {
      key: 'type_of_user',
      label: 'User Type',
      type: 'select',
      optionsSource: 'static',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
      ],
      placeholder: 'User Type',
    },
    {
      key: 'warehouse_id',
      label: 'Warehouse',
      type: 'select',
      optionsSource: 'warehouses',
      placeholder: 'Warehouse',
    },
    {
      key: 'shipment_manifest_id',
      label: 'Shipment Manifest',
      type: 'select',
      optionsSource: 'shipmentManifests',
      placeholder: 'Shipment Manifest',
    },
    {
      key: 'api_request',
      label: 'API Request',
      type: 'boolean',
      options: [
        { value: '1', label: 'Yes' },
        { value: '0', label: 'No' },
      ],
    },
    {
      key: 'is_insured',
      label: 'Insured',
      type: 'boolean',
      options: [
        { value: '1', label: 'Yes' },
        { value: '0', label: 'No' },
      ],
    },
  ],
};

/**
 * Users (customer list) — performed_action chips + user type select.
 */
export const usersFilterConfig: ModuleFilterConfigModel = {
  id: 'users',
  route: ['portal', 'customer', 'all'],
  transport: 'legacy-parallel',
  pagination: { pageParam: 'page', sizeParam: 'size' },
  search: {
    param: 'search',
    label: 'Search',
    placeholder: 'Search',
  },
  date: {
    rangeParams: { from: 'from', to: 'to' },
    fieldParam: 'date',
    fields: [{ value: 'created_at', label: 'Date Created' }],
  },
  sort: {
    param: 'order',
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
  },
  fields: [
    {
      key: 'performed_action',
      label: 'Performed Action',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'pending', label: 'Pending', color: '#DBB316' },
        { value: 'approved', label: 'Approved', color: '#25945c' },
        { value: 'rejected', label: 'Rejected', color: '#FF001C' },
      ],
    },
    {
      key: 'type',
      label: 'User Type',
      type: 'select',
      optionsSource: 'static',
      options: [
        { value: 'individual', label: 'Individual' },
        { value: 'business', label: 'Business' },
      ],
      placeholder: 'User Type',
    },
  ],
};

/**
 * Named-transport example — newer endpoints with direct query keys.
 */
export const shipmentTrackingItemFilterConfig: ModuleFilterConfigModel = {
  id: 'shipment-tracking-item-list',
  transport: FilterTransport.Named,
  pagination: { pageParam: 'page', sizeParam: 'size' },
  search: {
    param: 'search',
    label: 'Search',
    placeholder: 'Search',
  },
  date: {
    rangeParams: { from: 'from', to: 'to' },
    fieldParam: 'date',
    fields: [{ value: 'created_at', label: 'Date Created' }],
  },
  fields: [
    {
      key: 'claim_status',
      label: 'Claim Status',
      type: 'enum',
      exclusive: true,
      options: [
        { value: 'open', label: 'Open', color: '#25945c' },
        { value: 'closed', label: 'Closed', color: '#667185' },
        { value: 'pending', label: 'Pending', color: '#DBB316' },
      ],
    },
  ],
};

/** Seed registry — look up config by module id. */
export const FILTER_CONFIGS = {
  'track-shipments': trackShipmentsFilterConfig,
  'update-shipments': updateShipmentsFilterConfig,
  users: usersFilterConfig,
  'shipment-tracking-item-list': shipmentTrackingItemFilterConfig,
} as const;

/** Module ids present in {@link FILTER_CONFIGS}. */
export type FilterConfigId = keyof typeof FILTER_CONFIGS;
