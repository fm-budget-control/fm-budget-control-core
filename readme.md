# @fm-budget-control/fm-budget-control-core

Hexagonal architecture use cases and ports for **fm-budget-control**.

This package holds the application layer: use cases, the ports they depend on, and
the errors they throw. Adapters (Firebase, HTTP, persistence) live in the consuming
application and implement these ports.

The domain model — value objects and entities — is **internal**. The published
boundary deliberately traffics in plain `string` values, so adapters never depend on
domain types. See [Public API surface](#public-api-surface).

---

## Install

```bash
npm install @fm-budget-control/fm-budget-control-core
```

## Requirements

| Requirement | Value |
|---|---|
| **Node.js** | `>=24` |
| **Module system** | **ESM only** — there is no CommonJS build; `require()` will fail |
| **TypeScript `moduleResolution`** | `node16`, `nodenext`, or `bundler` |

The package is `"type": "module"` and exposes its API exclusively through
[subpath exports](https://nodejs.org/api/packages.html#subpath-exports). Legacy
`moduleResolution: "node"` cannot read an `exports` map and will fail with
`TS2307: Cannot find module ... or its corresponding type declarations`. Set:

```jsonc
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

## Public API surface

Three subpaths. **There is no root export and no deep imports** — anything else
fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

| Import specifier | Exports |
|---|---|
| `@fm-budget-control/fm-budget-control-core/user/application` | `RegisterUserUseCase`, type `RegisterUserCommand`, and the errors below |
| `@fm-budget-control/fm-budget-control-core/user/ports` | *types only* — `UserRepositoryPort`, `UserRecord`, `CreateProfileResult`, `AuthProviderPort`, `CreateAccountResult` |
| `@fm-budget-control/fm-budget-control-core/kernel/ports` | *types only* — `HmacIdDeriverPort` |

Value objects (`Email`, `Money`, `Id`, `IsoDate`, …) and the `User` entity are
**not exported**. They ship inside the package because the use case depends on them
at runtime, but they are implementation details and may change in any release.
If you need one exposed, open an issue — adding an export is a non-breaking change.

## Quick start

Implement the three ports, then wire the use case. Everything crossing the boundary
is a plain `string`.

```ts
import { RegisterUserUseCase } from "@fm-budget-control/fm-budget-control-core/user/application";
import type {
  UserRepositoryPort,
  AuthProviderPort,
} from "@fm-budget-control/fm-budget-control-core/user/ports";
import type { HmacIdDeriverPort } from "@fm-budget-control/fm-budget-control-core/kernel/ports";

const userRepository: UserRepositoryPort = {
  async createProfile(record) {
    // Persist. Return "already-exists" if this id is already stored.
    return "created";
  },
};

const authProvider: AuthProviderPort = {
  async createAccount({ id, email, password, displayName }) {
    // Create the auth account. If the email already owns one, return that
    // account's uid — it is the source of truth, not the requested id.
    return { status: "created", uid: id };
  },
};

const userIdDeriver: HmacIdDeriverPort = {
  async derive(input) {
    // Deterministically derive an id from the normalised email.
    return computeHmac(input);
  },
};

const useCase = new RegisterUserUseCase(userRepository, authProvider, userIdDeriver);

const userId = await useCase.execute({
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  birthDate: "1990-01-01", // YYYY-MM-DD
  password: "P@ssw0rd1",
});
```

`execute` returns the **canonical account id**. When the email already owns an auth
account, that account's uid is returned — which may differ from the derived id
(imported accounts, or ids derived before a secret rotation).

### Input contracts

| Field | Rules |
|---|---|
| `fullName` | Trimmed, internal whitespace collapsed. 3–100 chars. Letters, combining marks, spaces, hyphens, apostrophes. At least two space-separated parts. Unicode-aware. |
| `email` | Trimmed and lowercased. Max 254 chars; local part max 64; each domain label max 63. Requires at least two domain labels. |
| `birthDate` | Exactly `YYYY-MM-DD`, a real calendar date. Must be **18 years or older**. |
| `password` | 5–16 chars, at least one digit and one special character. Never trimmed — whitespace is significant. |

## Error handling

All errors are exported from `/user/application`. Branch on them with `instanceof`:

```ts
import {
  EmailAlreadyRegisteredError,
  UnderageUserError,
  InvalidFullNameError,
  InvalidEmailError,
  InvalidPasswordError,
  InvalidIsoDateError,
} from "@fm-budget-control/fm-budget-control-core/user/application";

try {
  await useCase.execute(command);
} catch (error) {
  if (error instanceof EmailAlreadyRegisteredError) return conflict();
  if (
    error instanceof InvalidFullNameError ||
    error instanceof InvalidEmailError ||
    error instanceof InvalidPasswordError ||
    error instanceof InvalidIsoDateError ||
    error instanceof UnderageUserError
  ) {
    return badRequest(error.message);
  }
  throw error; // unexpected — treat as a server fault
}
```

| Error | Meaning |
|---|---|
| `InvalidFullNameError` | `fullName` failed validation |
| `InvalidEmailError` | `email` failed validation |
| `InvalidPasswordError` | `password` failed validation; the message names the rule and never echoes the value |
| `InvalidIsoDateError` | `birthDate` is not a real `YYYY-MM-DD` date |
| `UnderageUserError` | The user is under 18 |
| `EmailAlreadyRegisteredError` | A profile already exists for this account |

Two caveats worth knowing:

- **Validation error messages echo the offending input** (e.g. `Invalid email address: "…"`).
  `InvalidPasswordError` is the deliberate exception. Consider this before forwarding
  messages verbatim to end users or logs.
- **Errors thrown by your own port implementations propagate unwrapped.** A failure from
  your database or auth provider surfaces as-is.

## Versioning

[Semantic versioning](https://semver.org). **Only the three subpaths above are public API.**
Internal modules — including every value object and entity — are not covered and may
change in any release.

Releases are automated with [semantic-release](https://semantic-release.gitbook.io/)
from [Conventional Commits](https://www.conventionalcommits.org/). Packages are
published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
via Trusted Publishing.

## Migration notes

### 1.6.0 → 2.0.0

`AuthProviderPort.createAccount` now resolves to an object instead of a status string:

```diff
- type CreateAccountResult = "created" | "email-already-exists";
+ type CreateAccountResult = { status: "created" | "email-already-exists"; uid: string };
```

Return the canonical account uid. When `status` is `"email-already-exists"`, return the
uid of the account that already owns the email — the use case creates the profile under
it and returns it to the caller.

### 1.5.0 → 1.6.0 — unflagged breaking change

> **`1.6.0` was published as a minor release but contained breaking changes.**
> This was a release-tooling defect, since fixed. If you are on `1.5.x`, treat the
> upgrade as a major one.

Both ports were rewritten:

```diff
  interface UserRepositoryPort {
-   existsById(id: string): Promise<boolean>;
-   save(record: UserRecord): Promise<void>;
+   createProfile(record: UserRecord): Promise<CreateProfileResult>;
  }

  interface AuthProviderPort {
-   accountExistsById(id: string): Promise<boolean>;
-   createAccount(id: string, email: string, password: string): Promise<void>;
-   updatePassword(id: string, password: string): Promise<void>;
+   createAccount(params: {
+     id: string; email: string; password: string; displayName: string;
+   }): Promise<CreateAccountResult>;
  }
```

Existence checks are gone. `createProfile` reports `"already-exists"` instead, and
`createAccount` reports `"email-already-exists"` — collapsing check-then-act into a
single call.

## Security

This package has **zero runtime dependencies**. To report a vulnerability, see
[SECURITY.md](./SECURITY.md).

## License

[MIT](./license)
