# Release process

Implementation approval never authorizes publishing. npm publication, CDN upload, tag, push, or GitHub release requires explicit owner approval.

1. Confirm parity/docs scope.
2. Run lint, typecheck, unit/browser tests, docs coverage, dependency audit, and `git diff --check`.
3. Run `npm pack --dry-run --json` for every public workspace and confirm the allow-list excludes `.tsbuildinfo`, sources, secrets, and unrelated files while including README and LICENSE.
4. Run `npm run artifact:verify`; inspect seven tarballs, exports, licenses, bundle sizes, clean install, CDN assets, and SHA-384 hashes.
5. Test tarballs from a clean npm project and both CDN pages from clean served HTML.
6. Review API differences, approve SemVer, and replace placeholders with approved immutable versions/hashes.
7. Obtain explicit owner approval before every external release mutation.
8. Verify published bytes/hashes and preserve rollback/incident evidence.

Never overwrite immutable versioned artifacts.
