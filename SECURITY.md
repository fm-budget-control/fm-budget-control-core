# Security Policy

## Supported versions

Only the latest major version receives security updates. Fixes are released forward;
patches are not backported to earlier majors.

| Version | Supported |
|---|---|
| `2.x`   | Yes |
| `< 2.0` | No — upgrade to `2.x` |

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report privately through GitHub:

1. Go to the [Security tab](https://github.com/fm-budget-control/fm-budget-control-core/security).
2. Click **Report a vulnerability**.
3. Describe the issue, the affected version, and how to reproduce it.

This creates a private advisory visible only to the maintainers.

### What to expect

| Stage | Target |
|---|---|
| Acknowledgement | Within 5 business days |
| Initial assessment | Within 10 business days |
| Fix and release | Depends on severity; coordinated with you before disclosure |

Please allow a reasonable period to ship a fix before disclosing publicly. Credit is
given in the advisory unless you prefer otherwise.

## Scope

This package has **zero runtime dependencies**, so its attack surface is its own code
plus whatever the consuming application does with it.

**In scope**

- Input validation flaws in the published use cases and value objects — for example
  input that bypasses email, date, or password validation.
- Unintended disclosure of sensitive data through error messages, `toString()`, or
  `toJSON()`. `Password` is designed to never expose plaintext through any of these.
- Logic errors in `RegisterUserUseCase` that could produce incorrect account
  identifiers or cross-account data exposure.
- Anything affecting the integrity of the published artifact — packaging, the export
  map, or the release pipeline.

**Out of scope**

- Vulnerabilities in development dependencies that never ship to consumers. These are
  tracked as ordinary maintenance; report them as normal issues.
- Weaknesses in an adapter *your* application provides for `AuthProviderPort`,
  `UserRepositoryPort`, or `HmacIdDeriverPort`. This package defines those interfaces
  but does not implement them — in particular, the strength and secrecy of the HMAC
  key used by `HmacIdDeriverPort` is the implementer's responsibility.
- Password policy strength as a design choice. If you believe the rules are unsafe,
  open a regular issue.

## Verifying a release

Published packages carry [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
via GitHub Actions Trusted Publishing. Verify a download with:

```bash
npm audit signatures
```
