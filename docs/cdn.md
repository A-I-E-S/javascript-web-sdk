# CDN usage and release integrity

The AFRICANIES JavaScript Web SDK produces two self-contained browser bundles:

- `africanies-web-sdk.esm.js` for modern browsers and import maps;
- `africanies-web-sdk.global.js` for script-tag consumers, exposing only `globalThis.Africanies`.

## Versioned URLs

Production applications must pin an exact published version:

```html
<script src="https://cdn.jsdelivr.net/npm/@africanies/javascript-web-sdk@1.2.3/dist/africanies-web-sdk.global.js"
  integrity="sha384-RELEASE_MANIFEST_VALUE" crossorigin="anonymous"></script>
```

Do not use `@latest` in production. Exact-version CDN URLs are suitable for long-lived immutable caching. Consumers should still follow their CDN provider's documented cache semantics and purge behavior.

ES modules loaded with `import` do not currently provide a cross-browser `integrity` attribute. Applications requiring browser-enforced SRI should use the global bundle or self-host the verified ESM file under their own deployment controls.

## Integrity workflow

Before a release, run:

```sh
npm run artifact:verify
```

The verifier builds both bundles, calculates their SHA-384 SRI values, packs all workspace packages, installs the tarballs into a clean temporary npm project, and imports the umbrella package. Record the printed hashes in the immutable release manifest and versioned examples. A hash is valid only for the exact bytes and URL it was generated from.

Publishing, tagging, uploading to a CDN, or creating a GitHub release requires explicit owner approval and is never performed by the verification command.
