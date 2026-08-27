/** Public entry point for browser-safe storage adapters. */
export const STORAGE_PACKAGE_NAME = '@africanies/africanies-storage';

/** Persisted UI theme preference. */
export const AFRICANIES_THEME_KEY = 'africanies.theme';
/** Tab-scoped shipping mode. */
export const AFRICANIES_SHIPPING_MODE_KEY = 'africanies.shippingMode';
/** Cached mode configuration. */
export const AFRICANIES_MODE_CONFIG_KEY = 'africanies.modeConfig';
/** Persisted bearer access token. */
export const AFRICANIES_ACCESS_TOKEN_KEY = 'africanies.accessToken';

/** Minimum Web Storage contract required by the SDK. */
export interface StorageLike {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

/** Framework-independent identifier for consumers maintaining their own DI map. */
export const STORAGE_TOKEN = Symbol.for('AFRICANIES_STORAGE');

/** JSON-serializing browser key/value persistence abstraction. */
export abstract class StorageService {
  protected constructor(protected readonly storage: StorageLike) {}

  get<T>(key: string): T | null {
    const raw = this.storage.getItem(key);
    return raw === null || raw === '' ? null : JSON.parse(raw) as T;
  }

  set<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError('Storage values must be JSON-serializable');
    }
    this.storage.setItem(key, serialized);
  }

  remove(key: string): void {
    this.storage.removeItem(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

type StorageName = 'localStorage' | 'sessionStorage';

function browserStorage(name: StorageName): StorageLike {
  const storage = (globalThis as typeof globalThis & Partial<Record<StorageName, StorageLike>>)[name];
  if (storage === undefined) {
    throw new ReferenceError(`${name} is unavailable; inject a Storage-compatible object`);
  }
  return storage;
}

/** Persistent storage adapter. Global lookup is lazy and never occurs on import. */
export class LocalStorageService extends StorageService {
  constructor(storage: StorageLike = browserStorage('localStorage')) {
    super(storage);
  }
}

/** Current-tab storage adapter. Global lookup is lazy and never occurs on import. */
export class SessionStorageService extends StorageService {
  constructor(storage: StorageLike = browserStorage('sessionStorage')) {
    super(storage);
  }
}

/** Creates the active local-storage adapter, optionally with an injected test store. */
export function provideLocalStorage(storage?: StorageLike): LocalStorageService {
  return storage === undefined ? new LocalStorageService() : new LocalStorageService(storage);
}

/** Creates the active session-storage adapter, optionally with an injected test store. */
export function provideSessionStorage(storage?: StorageLike): SessionStorageService {
  return storage === undefined ? new SessionStorageService() : new SessionStorageService(storage);
}
