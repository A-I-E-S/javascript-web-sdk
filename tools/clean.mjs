import { rm } from 'node:fs/promises';

await Promise.all([
  rm('dist', { recursive: true, force: true }),
  ...['models', 'storage', 'core', 'theme', 'icons', 'ui', 'sdk'].map((name) =>
    rm(`packages/${name}/dist`, { recursive: true, force: true })
  )
]);
