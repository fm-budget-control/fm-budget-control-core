# Changelog

> **The authoritative per-release record is
> [GitHub Releases](https://github.com/fm-budget-control/fm-budget-control-core/releases)**,
> generated automatically from [Conventional Commits](https://www.conventionalcommits.org/)
> on every publish. This file is maintained by hand and covers history through
> `2.0.0` plus notable migrations; it may lag the newest release.

Only the three published subpaths — `./user/application`, `./user/ports`, and
`./kernel/ports` — are covered by semantic versioning. Internal modules, including
every value object and entity, may change in any release.

# [2.0.0](https://github.com/fm-budget-control/fm-budget-control-core/compare/v1.6.0...v2.0.0) (2026-07-19)

### ⚠ BREAKING CHANGES

* **`AuthProviderPort.createAccount` now resolves to an object rather than a status string.**

  ```diff
  - type CreateAccountResult = "created" | "email-already-exists";
  + type CreateAccountResult = { status: "created" | "email-already-exists"; uid: string };
  ```

  Implementations must return the canonical account uid. When the email already owns
  an auth account, return *that* account's uid — it may differ from the requested id
  for imported accounts, or for ids derived before a secret rotation.

* **`RegisterUserUseCase.execute` now returns the auth account's canonical uid**, and
  creates the profile under it, instead of always using the derived id.

### Features

* return canonical account uid from the auth provider's create-account port ([#102](https://github.com/fm-budget-control/fm-budget-control-core/pull/102))

## [1.6.0](https://github.com/fm-budget-control/fm-budget-control-core/compare/v1.5.0...v1.6.0) (2026-07-08)

> ### ⚠ This minor release contained BREAKING CHANGES
>
> `1.6.0` should have been `2.0.0`. The breaking commit was marked `feat!:` but the
> release tooling was configured with a preset that does not recognise the `!` marker,
> so the change did not raise the major version. **If you are upgrading from `1.5.x`,
> treat this as a major upgrade.**
>
> The tooling defect is fixed as of `2.1.0`; see that entry.

### ⚠ BREAKING CHANGES

* **Both application ports were rewritten**, removing four methods:

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

  Existence checks are gone. `createProfile` reports `"already-exists"` and
  `createAccount` reports `"email-already-exists"`, collapsing check-then-act into a
  single call.

* `CreateProfileResult` and `CreateAccountResult` added to `./user/ports`.

### Features

* refactor application ports ([#97](https://github.com/fm-budget-control/fm-budget-control-core/pull/97))
* stabilizing ([#99](https://github.com/fm-budget-control/fm-budget-control-core/pull/99))

## [1.5.0](https://github.com/fm-budget-control/fm-budget-control-core/compare/v1.4.0...v1.5.0) (2026-07-05)

### Features

* move the id deriver port to the kernel, published as `./kernel/ports` ([#95](https://github.com/fm-budget-control/fm-budget-control-core/pull/95))
* add `HmacIdDeriverPort` for deterministic user-id derivation ([#91](https://github.com/fm-budget-control/fm-budget-control-core/pull/91), [#93](https://github.com/fm-budget-control/fm-budget-control-core/pull/93))

## [1.4.0](https://github.com/fm-budget-control/fm-budget-control-core/compare/v1.3.0...v1.4.0) (2026-07-01)

First release with a usable application layer.

### Features

* add the user application layer with `RegisterUserUseCase` ([#80](https://github.com/fm-budget-control/fm-budget-control-core/pull/80))
* export the user use cases as `./user/application` ([#84](https://github.com/fm-budget-control/fm-budget-control-core/pull/84))
* add `User.reconstitute` for rehydrating persisted users ([#72](https://github.com/fm-budget-control/fm-budget-control-core/pull/72))

### Bug Fixes

* correct value object error types and messages ([#88](https://github.com/fm-budget-control/fm-budget-control-core/pull/88))
* base the age check on `birthDate` ([#68](https://github.com/fm-budget-control/fm-budget-control-core/pull/68))
* replace the UUID value object with the branded `Id` ([#66](https://github.com/fm-budget-control/fm-budget-control-core/pull/66))

## 1.0.0 – 1.3.0 (2026-06-15 – 2026-06-17)

Early development. These releases were used to exercise the release pipeline and do
not represent a stable API — several contain placeholder code. Do not use them.
