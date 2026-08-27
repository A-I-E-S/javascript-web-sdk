# Security policy

This project is pre-release and has no supported production version. Do not disclose vulnerabilities in public issues.

Use GitHub private vulnerability reporting when enabled, or the private contact channel in the A.I.E.S organization profile. Include affected commit/version, reproduction, impact, and mitigation; never include real credentials or personal data.

Consumers remain responsible for XSS prevention, CSP, scoped credentials, token handling, TLS/CORS, trusted sprite hosting, and sensitive-log avoidance. Before release, run dependency audit and `npm run artifact:verify`; review findings instead of dismissing them automatically.
