const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

declare const uuidBrand: unique symbol;

export class InvalidUuidError extends TypeError {
  constructor(value: string) {
    super(`Invalid UUIDv4: "${value}"`);
    this.name = "InvalidUuidError";
  }
}

/**
 * UUID v4 value object.
 *
 * Represents a validated, canonical UUID v4 string.
 *
 * This value object is intentionally generation-free.
 * UUID generation should live behind an application port, implemented by
 * infrastructure using something like node:crypto randomUUID().
 */
export class Uuid<TBrand = unknown> {
  declare private readonly [uuidBrand]: TBrand;

  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Strict factory for already-normalized domain-safe values.
   *
   * This method does not trim or lowercase the input.
   * Use this when the value is expected to already be canonical.
   */
  static of<TBrand = unknown>(value: string): Uuid<TBrand> {
    if (!Uuid.isValid(value)) {
      throw new InvalidUuidError(value);
    }

    return new Uuid<TBrand>(value);
  }

  /**
   * Boundary-friendly parser.
   *
   * This method trims and lowercases the input before validating it.
   * Use this for external inputs, persistence mappers, DTOs, HTTP params,
   * message payloads, CSV imports, and similar adapter-level data.
   */
  static parse<TBrand = unknown>(value: string): Uuid<TBrand> {
    const normalized = Uuid.normalize(value);

    if (!Uuid.isValid(normalized)) {
      throw new InvalidUuidError(value);
    }

    return new Uuid<TBrand>(normalized);
  }

  /**
   * Non-throwing parser.
   *
   * Useful when invalid input is an expected possibility.
   */
  static tryParse<TBrand = unknown>(value: string): Uuid<TBrand> | null {
    const normalized = Uuid.normalize(value);

    if (!Uuid.isValid(normalized)) {
      return null;
    }

    return new Uuid<TBrand>(normalized);
  }

  /**
   * Checks whether a value is already a canonical UUID v4 string.
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
    return UUID_V4_REGEX.test(value);
  }

  /**
   * Normalizes external UUID input into canonical lowercase form.
   */
  private static normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * Value equality, independent of brand.
   *
   * Accepts `unknown` so this can never throw regardless of what's passed —
   * safe to call with values that haven't been parsed into a `Uuid` yet
   * (deserialized JSON, optional fields, `Map.get` results, etc.). Returns
   * `false` for `null`, `undefined`, primitives, and structurally similar
   * but non-`Uuid` objects, rather than throwing.
   *
   * Note: this compares by value only, not by brand (see `Uuid<unknown>`
   * on `of`/`parse`). A `UserId` and an `AccountId` holding the same string
   * will compare equal here. Do not rely on `equals` alone for brand-
   * sensitive checks — the type system, not this method, is what prevents
   * a `UserId` from being passed where an `AccountId` is expected.
   */
  equals(other: unknown): boolean {
    return other instanceof Uuid && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}