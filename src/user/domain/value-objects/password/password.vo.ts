const MIN_LENGTH = 5;
const MAX_LENGTH = 16;
const HAS_NUMBER = /\d/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

export class InvalidPasswordError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPasswordError";
  }
}

/**
 * Password value object.
 *
 * Represents a validated plaintext password, held only long enough to be
 * handed to an AuthServicePort for hashing. Unlike other kernel/domain VOs,
 * the raw value is intentionally NOT exposed as a public field — `value`
 * being public on Id/Email/FullName is fine since those aren't secrets;
 * here it would defeat the point of having a VO at all. Use
 * `revealForHashing()` at the one call site that actually needs the
 * plaintext, never `.value`.
 *
 * No trimming or case-folding is applied anywhere, including in `parse`.
 * Unlike Email or FullName, whitespace in a password is significant —
 * silently stripping it would silently change what the user typed.
 */
export class Password {
  private constructor(private readonly raw: string) {
    Object.freeze(this);
  }

  /**
   * Factory and sole entry point.
   *
   * There is no separate boundary-friendly `parse` because there is no
   * normalization step for a password to begin with — `of` and `parse`
   * would be identical, so only `of` exists.
   */
  static of(value: string): Password {
    if (!Password.isValid(value)) {
      throw new InvalidPasswordError(Password.describeViolation(value));
    }

    return new Password(value);
  }

  /**
   * Non-throwing factory.
   *
   * Useful when invalid input is an expected possibility, e.g. live
   * validation on a registration form.
   */
  static tryParse(value: string): Password | null {
    if (!Password.isValid(value)) {
      return null;
    }

    return new Password(value);
  }

  /**
   * Checks whether a value satisfies all password rules.
   */
  static isValid(value: string): boolean {
    return (
      typeof value === "string" &&
      value.length >= MIN_LENGTH &&
      value.length <= MAX_LENGTH &&
      HAS_NUMBER.test(value) &&
      HAS_SPECIAL.test(value)
    );
  }

  /**
   * Builds a human-readable reason for the first rule a value fails.
   * Used only to produce `InvalidPasswordError` messages from `of`.
   */
  private static describeViolation(value: string): string {
    if (typeof value !== "string" || value.length === 0) {
      return "Password must be a non-empty string";
    }

    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
      return `Password must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`;
    }

    if (!HAS_NUMBER.test(value)) {
      return "Password must contain at least one number";
    }

    return "Password must contain at least one special character";
  }

  /**
   * Returns the plaintext password.
   *
   * Named deliberately instead of a plain getter so every call site makes
   * the intent visible — this should be called exactly once, right before
   * handing the value to an AuthServicePort for hashing. Never log, persist,
   * or pass this value anywhere else.
   */
  revealForHashing(): string {
    return this.raw;
  }

  /**
   * Value equality.
   *
   * Accepts `unknown` so this can never throw regardless of what's passed —
   * safe to call with values that haven't been parsed into a `Password` yet.
   * Returns `false` for `null`, `undefined`, primitives, and structurally
   * similar but non-`Password` objects, rather than throwing.
   */
  equals(other: unknown): boolean {
    return other instanceof Password && this.raw === other.raw;
  }

  toString(): string {
    return "********";
  }

  toJSON(): string {
    return "********";
  }
}
