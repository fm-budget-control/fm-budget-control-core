const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class InvalidIsoDateError extends TypeError {
  constructor(value: string) {
    super(`Invalid IsoDate: "${value}"`);
    this.name = "InvalidIsoDateError";
  }
}

/**
 * Calendar-date value object (no time component, no timezone).
 *
 * Represents a validated "YYYY-MM-DD" string, guaranteed to correspond to a
 * real calendar date (JS Date auto-correction, e.g. 2024-02-31 silently
 * becoming 2024-03-02, is rejected rather than tolerated).
 *
 * All comparisons go through `toUTCDate()` / `toDaysSinceEpoch()`, which are
 * timezone-independent. Do not call `new Date(value)` directly anywhere
 * outside this file and rely on local getters (getFullYear, getMonth,
 * getDate) — they are sensitive to the host's TZ and will misread the date
 * near midnight in negative-offset zones. Always go through this VO's UTC
 * accessors instead.
 */
export class IsoDate {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Strict factory for already-normalized domain-safe values.
   *
   * This method does not trim the input.
   * Use this when the value is expected to already be canonical.
   */
  static of(value: string): IsoDate {
    if (!IsoDate.isValid(value)) {
      throw new InvalidIsoDateError(value);
    }

    return new IsoDate(value);
  }

  /**
   * Boundary-friendly parser.
   *
   * This method trims the input before validating it.
   * Use this for external inputs, persistence mappers, DTOs, HTTP params,
   * message payloads, CSV imports, and similar adapter-level data.
   */
  static parse(value: string): IsoDate {
    const normalized = IsoDate.normalize(value);

    if (!IsoDate.isValid(normalized)) {
      throw new InvalidIsoDateError(value);
    }

    return new IsoDate(normalized);
  }

  /**
   * Non-throwing parser.
   *
   * Useful when invalid input is an expected possibility.
   */
  static tryParse(value: string): IsoDate | null {
    const normalized = IsoDate.normalize(value);

    if (!IsoDate.isValid(normalized)) {
      return null;
    }

    return new IsoDate(normalized);
  }

  /**
   * Checks whether a value is already a canonical "YYYY-MM-DD" string
   * representing a real calendar date.
   *
   * This method does not trim the input.
   *
   * Contract: this method operates on the raw string only. `of` calls this
   * directly on unnormalized input, and `parse`/`tryParse` call this on
   * already-normalized input. Do not add trimming here — doing so would
   * silently change `of`'s behavior, since `of` has no normalization step
   * of its own to fall back on.
   */
  static isValid(value: string): boolean {
    if (!ISO_DATE_REGEX.test(value)) {
      return false;
    }

    const [year, month, day] = value.split("-").map(Number) as [
      number,
      number,
      number,
    ];
    const date = new Date(`${value}T00:00:00Z`);

    // Guard against JS Date auto-correction (e.g. 2024-02-31 -> 2024-03-02).
    // Comparing against UTC getters specifically, since the string is
    // parsed as UTC midnight per the ECMA-262 date-only string rule.
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }

  /**
   * Normalizes external IsoDate input by trimming surrounding whitespace.
   */
  private static normalize(value: string): string {
    return value.trim();
  }

  /**
   * Returns a `Date` instance representing this calendar date at UTC
   * midnight. This is the single source of truth for converting this VO
   * into a comparable value — use this (or `toDaysSinceEpoch`) for any
   * arithmetic or comparison logic instead of re-parsing `.value` directly.
   */
  toUTCDate(): Date {
    return new Date(`${this.value}T00:00:00Z`);
  }

  /**
   * Returns the number of whole days since the Unix epoch (1970-01-01 UTC).
   * Convenient for simple "is N days apart" arithmetic without constructing
   * intermediate `Date` objects at call sites.
   */
  toDaysSinceEpoch(): number {
    return Math.floor(this.toUTCDate().getTime() / 86_400_000);
  }

  /**
   * Value equality.
   *
   * Accepts `unknown` so this can never throw regardless of what's passed —
   * safe to call with values that haven't been parsed into an `IsoDate` yet.
   * Returns `false` for `null`, `undefined`, primitives, and structurally
   * similar but non-`IsoDate` objects, rather than throwing.
   */
  equals(other: unknown): boolean {
    return other instanceof IsoDate && this.value === other.value;
  }

  isBefore(other: IsoDate): boolean {
    return this.toUTCDate().getTime() < other.toUTCDate().getTime();
  }

  isAfter(other: IsoDate): boolean {
    return this.toUTCDate().getTime() > other.toUTCDate().getTime();
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}