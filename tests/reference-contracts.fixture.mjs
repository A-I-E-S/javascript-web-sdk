export const STORAGE_KEYS = Object.freeze({
  theme: 'africanies.theme',
  shippingMode: 'africanies.shippingMode',
  modeConfig: 'africanies.modeConfig',
  accessToken: 'africanies.accessToken'
});

export const DELIVERY_VENDOR_IDS = Object.freeze([
  'amazon',
  'dhl',
  'fedex',
  'usps',
  'ups',
  'others'
]);

export const MODE_COLOR_CLASSES = Object.freeze({
  sfn: Object.freeze({
    text: 'text-export',
    bg: 'bg-export',
    bgSubtle: 'bg-export-subtle',
    border: 'border-export',
    primary: 'bg-export text-white border-transparent hover:bg-export-light',
    ghostPrimary: 'bg-transparent text-export border-transparent hover:bg-export-subtle dark:hover:bg-export/15',
    soft: 'bg-export-subtle dark:bg-export/15',
    softHover: 'hover:bg-export-subtle dark:hover:bg-export/15'
  }),
  stn: Object.freeze({
    text: 'text-import',
    bg: 'bg-import',
    bgSubtle: 'bg-import-subtle',
    border: 'border-import',
    primary: 'bg-import text-white border-transparent hover:bg-import-light',
    ghostPrimary: 'bg-transparent text-import border-transparent hover:bg-import-subtle dark:hover:bg-import/15',
    soft: 'bg-import-subtle dark:bg-import/15',
    softHover: 'hover:bg-import-subtle dark:hover:bg-import/15'
  })
});

export const LARAVEL_PAGE = Object.freeze({
  current_page: 2,
  data: Object.freeze([{ id: 12, name: 'Africanies Air Expedited' }]),
  last_page: 59,
  per_page: 15,
  total: 587,
  next_page_url: 'https://example.test/catalog?page=3',
  prev_page_url: 'https://example.test/catalog?page=1'
});

export const NORMALIZED_PAGE = Object.freeze({
  current_page: 2,
  per_page: 15,
  total_items: 587,
  total_pages: 59,
  has_next_page: true,
  has_previous_page: true
});

export const VALIDATION_BAG = Object.freeze({
  email: Object.freeze([
    'The email field is required.',
    'The email must be valid.'
  ])
});

export const ICON_CONTRACT = Object.freeze({
  count: 641,
  containerId: 'africanies-icon-sprite',
  defaultSpriteUrl: '/assets/africanies-icons/icons.sprite.svg'
});

export const PUBLIC_RUNTIME_CONTRACT = Object.freeze({
  models: Object.freeze([
    'DELIVERY_VENDORS', 'EXPORT_DELIVERY_VENDORS', 'FilterTransport',
    'cloneFilterState', 'emptyFilterState', 'fromFilterParams',
    'hasFilterParams', 'normalizeDeliveryVendorForForm', 'toFilterParams'
  ]),
  storage: Object.freeze([
    'AFRICANIES_ACCESS_TOKEN_KEY', 'AFRICANIES_MODE_CONFIG_KEY',
    'AFRICANIES_SHIPPING_MODE_KEY', 'AFRICANIES_THEME_KEY',
    'LocalStorageService', 'SessionStorageService', 'StorageService',
    'provideLocalStorage', 'provideSessionStorage'
  ]),
  core: Object.freeze([
    'ApiClient', 'AuthTokenService', 'HttpResponseCache',
    'ShippingModeService', 'normalize', 'normalizePagination',
    'unwrapLaravelPaginator'
  ]),
  theme: Object.freeze([
    'MODE_COLOR_SAFELIST', 'ModeColorService', 'ThemeService'
  ]),
  icons: Object.freeze([
    'AFRICANIES_ICON_SPRITE_URL', 'ICON_NAMES', 'IconRegistryService'
  ])
});
