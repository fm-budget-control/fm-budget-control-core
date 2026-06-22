const MAX_EMAIL_LENGTH = 254;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InvalidEmailError extends TypeError {
  constructor(value: string) {
    super(`Invalid email address: "${value}"`);
    this.name = "InvalidEmailError";
  }
}

/**
 * Email value object.
 *
 * Represents a validated, normalized (trimmed, lowercased) email address.
 *
 * This value object does not verify deliverability or mailbox existence —
 * it only enforces structural validity and a length guard consistent with
 * RFC 5321 (local-part + "@" + domain <= 254 characters).
 */
export class Email {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Strict factory for already-normalized domain-safe values.
   *
   * This method does not trim or lowercase the input.
   * Use this when the value is expected to already be canonical.
   */
  static of(value: string): Email {
    if (!Email.isValid(value)) {
      throw new InvalidEmailError(value);
    }

    return new Email(value);
  }

  /**
   * Boundary-friendly parser.
   *
   * This method trims and lowercases the input before validating it.
   * Use this for external inputs, persistence mappers, DTOs, HTTP params,
   * message payloads, CSV imports, and similar adapter-level data.
   */
  static parse(value: string): Email {
    const normalized = Email.normalize(value);

    if (!Email.isValid(normalized)) {
      throw new InvalidEmailError(value);
    }

    return new Email(normalized);
  }

  /**
   * Non-throwing parser.
   *
   * Useful when invalid input is an expected possibility.
   */
  static tryParse(value: string): Email | null {
    const normalized = Email.normalize(value);

    if (!Email.isValid(normalized)) {
      return null;
    }

    return new Email(normalized);
  }

  /**
   * Checks whether a value is already a canonical, structurally valid
   * email address.
   *
   * This method does not trim or lowercase the input.
   *
   * Contract: this method operates on the raw string only. `of` calls this
   * directly on unnormalized input, and `parse`/`tryParse` call this on
   * already-normalized input. Do not add trimming or case-folding here —
   * doing so would silently change `of`'s behavior (it would start
   * accepting non-canonical input) since `of` has no normalization step
   * of its own to fall back on.
   */
  static isValid(value: string): boolean {
    return (
      value.length <= MAX_EMAIL_LENGTH &&
      value === value.toLowerCase() &&
      EMAIL_REGEX.test(value)
    );
  }

  /**
   * Normalizes external email input into canonical lowercase, trimmed form.
   */
  private static normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * Value equality.
   *
   * Accepts `unknown` so this can never throw regardless of what's passed —
   * safe to call with values that haven't been parsed into an `Email` yet
   * (deserialized JSON, optional fields, `Map.get` results, etc.). Returns
   * `false` for `null`, `undefined`, primitives, and structurally similar
   * but non-`Email` objects, rather than throwing.
   */
  equals(other: unknown): boolean {
    return other instanceof Email && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
