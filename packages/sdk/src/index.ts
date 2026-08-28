export * from '@africanies/africanies-models';
export * from '@africanies/africanies-storage';
export * from '@africanies/africanies-core';
export * from '@africanies/africanies-theme';
export * from '@africanies/africanies-icons';
export * from '@africanies/africanies-ui';

declare const __AFRICANIES_SDK_VERSION__: string | undefined;

/** Package version; browser bundles may override it through the reproducible build input. */
export const VERSION = typeof __AFRICANIES_SDK_VERSION__ === 'string'
  ? __AFRICANIES_SDK_VERSION__
  : '0.1.0';
