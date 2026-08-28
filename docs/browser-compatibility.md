# Browser compatibility

Target support is the current and previous major Chrome, Edge, Firefox, and Safari releases. Internet Explorer is unsupported. Output targets ES2020.

Required features include ESM, Fetch, `URL`, `AbortController`, Custom Elements, Shadow DOM, and modern events. Defaults also use Web Storage. Form association depends on `ElementInternals`; hosts must test and provide fallbacks for their browser matrix.

Imports are Node/SSR-safe, but DOM, storage, clipboard, and network operations require injected capabilities or browser globals. Release candidates require Chromium, Firefox, and WebKit integration checks; unit coverage is not a claim of complete catalog certification.
