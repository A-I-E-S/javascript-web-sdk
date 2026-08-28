# Contributing

Read [Project Context](https://github.com/A-I-E-S/javascript-web-sdk-context) and the Angular reference before changing public behavior. Use a feature branch, preserve package boundaries/attribution, and add no Angular, CDK, or RxJS runtime dependency.

Write contract tests first, implement the smallest idiomatic equivalent, update parity/docs, then run:

```sh
npm run check
npm run artifact:verify
git diff --check
```

Public API, browser, accessibility, HTTP/storage, security, and release changes require heightened review. Never commit credentials or tarballs.

Contributors: Ikechukwu, Chinedu, Armstrong, Adebowale, Muhydeen, Dotun, and Busola.
