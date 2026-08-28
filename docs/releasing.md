# Release process

Implementation approval never authorizes publishing. npm publication, CDN upload, tag, push, or GitHub release requires explicit owner approval.

1. Confirm parity/docs scope.
2. Run lint, typecheck, unit/browser tests, docs coverage, dependency audit, and `git diff --check`.
3. Run `npm run artifact:verify`; inspect seven tarballs, exports, licenses, bundle sizes, clean install, and SHA-384 hashes.
4. Test tarballs from a clean npm project and both CDN pages from clean served HTML.
5. Review API differences, choose SemVer, and replace placeholders with approved immutable versions/hashes.
6. Obtain explicit owner approval before every external release mutation.
7. Verify published bytes/hashes and preserve rollback/incident evidence.

Never overwrite immutable versioned artifacts.
