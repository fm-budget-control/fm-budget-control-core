# Public API surface

<!-- GENERATED FILE — do not edit by hand.
     Regenerate with: npm run api:report
     CI fails if this file does not match the built declarations. A diff here
     means the public API changed: make sure the release is versioned to match. -->

Package: `@fm-budget-control/fm-budget-control-core`

Only the subpaths below are public API. Everything else in `dist` is an
internal implementation detail and is not covered by semantic versioning.

## `@fm-budget-control/fm-budget-control-core/kernel/ports`

```ts
export interface HmacIdDeriverPort {
    derive(input: string): Promise<string>;
}
```

## `@fm-budget-control/fm-budget-control-core/user/application`

```ts
export declare class EmailAlreadyRegisteredError extends Error {
    constructor();
}

export declare class InvalidEmailError extends TypeError {
    constructor(value: string);
}

export declare class InvalidFullNameError extends TypeError {
    constructor(value: string);
}

export declare class InvalidIsoDateError extends TypeError {
    constructor(value: string);
}

export declare class InvalidPasswordError extends TypeError {
    constructor(message: string);
}

export type RegisterUserCommand = {
    fullName: string;
    email: string;
    birthDate: string;
    password: string;
};

export declare class RegisterUserUseCase {
    private readonly userRepository;
    private readonly authProvider;
    private readonly userIdDeriver;
    constructor(userRepository: UserRepositoryPort, authProvider: AuthProviderPort, userIdDeriver: HmacIdDeriverPort);
    execute(command: RegisterUserCommand): Promise<string>;
}

export declare class UnderageUserError extends TypeError {
    constructor();
}
```

## `@fm-budget-control/fm-budget-control-core/user/ports`

```ts
export interface AuthProviderPort {
    createAccount(params: {
        id: string;
        email: string;
        password: string;
        displayName: string;
    }): Promise<CreateAccountResult>;
}

export type CreateAccountResult = {
    status: "created" | "email-already-exists";
    uid: string;
};

export type CreateProfileResult = "created" | "already-exists";

export type UserRecord = {
    id: string;
    fullName: string;
    email: string;
    birthDate: string;
    createdAt: string;
    updatedAt: string;
};

export interface UserRepositoryPort {
    createProfile(record: UserRecord): Promise<CreateProfileResult>;
}
```
