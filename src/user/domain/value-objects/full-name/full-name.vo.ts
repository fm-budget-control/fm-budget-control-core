const MIN_FULL_NAME_LENGTH = 3;
const MAX_FULL_NAME_LENGTH = 100;

/**
 * Unicode-aware character set: letters (\p{L}), combining marks (\p{M})
 * for accents, plus spaces, hyphens, and apostrophes. Supports names like
 * "José da Silva", "Anne-Marie", "D'Angelo", and other non-ASCII names.
 */
const FULL_NAME_CHARACTERS_REGEX = /^[\p{L}\p{M}'-]+(?: [\p{L}\p{M}'-]+)+$/u;

export class InvalidFullNameError extends TypeError {
  constructor(value: string) {
    super(`Invalid full name: "${value}"`);
    this.name = "InvalidFullNameError";
  }
}

/**
 * FullName value object.
 *
 * Represents a validated, normalized (trimmed, collapsed whitespace) full
 * name, requiring at least a first and last name separated by a space.
 */
export class FullName {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Strict factory for already-normalized domain-safe values.
   *
   * This method does not trim or collapse whitespace in the input.
   * Use this when the value is expected to already be canonical.
   */
  static of(value: string): FullName {
    if (!FullName.isValid(value)) {
      throw new InvalidFullNameError(value);
    }

    return new FullName(value);
  }

  /**
   * Boundary-friendly parser.
   *
   * This method trims and collapses internal whitespace before validating
   * it. Use this for external inputs, persistence mappers, DTOs, HTTP
   * params, message payloads, CSV imports, and similar adapter-level data.
   */
  static parse(value: string): FullName {
    const normalized = FullName.normalize(value);

    if (!FullName.isValid(normalized)) {
      throw new InvalidFullNameError(value);
    }

    return new FullName(normalized);
  }

  /**
   * Non-throwing parser.
   *
   * Useful when invalid input is an expected possibility.
   */
  static tryParse(value: string): FullName | null {
    const normalized = FullName.normalize(value);

    if (!FullName.isValid(normalized)) {
      return null;
    }

    return new FullName(normalized);
  }

  /**
   * Checks whether a value is already a canonical, structurally valid
   * full name: within length bounds, containing only letters, combining
   * marks, hyphens, and apostrophes, with at least two space-separated
   * parts.
   *
   * This method does not trim or collapse whitespace in the input.
   *
   * Contract: this method operates on the raw string only. `of` calls this
   * directly on unnormalized input, and `parse`/`tryParse` call this on
   * already-normalized input. Do not add trimming or whitespace-collapsing
   * here — doing so would silently change `of`'s behavior (it would start
   * accepting non-canonical input) since `of` has no normalization step
   * of its own to fall back on.
   */
  static isValid(value: string): boolean {
    return (
      value.length >= MIN_FULL_NAME_LENGTH &&
      value.length <= MAX_FULL_NAME_LENGTH &&
      FULL_NAME_CHARACTERS_REGEX.test(value)
    );
  }

  /**
   * Normalizes external full name input: trims leading/trailing whitespace
   * and collapses repeated internal spaces into single spaces.
   */
  private static normalize(value: string): string {
    return value.trim().replace(/\s+/g, " ");
  }

  /**
   * Value equality.
   *
   * Accepts `unknown` so this can never throw regardless of what's passed —
   * safe to call with values that haven't been parsed into a `FullName` yet
   * (deserialized JSON, optional fields, `Map.get` results, etc.). Returns
   * `false` for `null`, `undefined`, primitives, and structurally similar
   * but non-`FullName` objects, rather than throwing.
   */
  equals(other: unknown): boolean {
    return other instanceof FullName && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
