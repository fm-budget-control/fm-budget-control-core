import { IsoDate } from "../iso-date/iso-date.vo.js";

// UTC-only: YYYY-MM-DDTHH:MM:SS[.mmm]Z
const ISO_DATETIME_UTC_REGEX =
  /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d{1,3})?Z$/;

export class InvalidIsoDateTimeError extends TypeError {
  constructor(value: string) {
    super(`Invalid IsoDateTime: "${value}"`);
    this.name = "InvalidIsoDateTimeError";
  }
}

/**
 * UTC datetime value object (seconds precision, optional milliseconds).
 *
 * Represents a validated ISO 8601 UTC datetime string of the form
 * "YYYY-MM-DDTHH:MM:SS[.mmm]Z". Timezone offsets other than Z are not
 * accepted — all datetimes in the domain are stored in UTC.
 *
 * Use for audit timestamps (createdAt, updatedAt) and any field that
 * represents a specific instant in time. For calendar-date-only fields
 * (birthDate, dueDate) use IsoDate instead.
 */
export class IsoDateTime {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  static of(value: string): IsoDateTime {
    if (!IsoDateTime.isValid(value)) {
      throw new InvalidIsoDateTimeError(value);
    }

    return new IsoDateTime(value);
  }

  static parse(value: string): IsoDateTime {
    const normalized = IsoDateTime.normalize(value);

    if (!IsoDateTime.isValid(normalized)) {
      throw new InvalidIsoDateTimeError(value);
    }

    return new IsoDateTime(normalized);
  }

  static tryParse(value: string): IsoDateTime | null {
    const normalized = IsoDateTime.normalize(value);

    if (!IsoDateTime.isValid(normalized)) {
      return null;
    }

    return new IsoDateTime(normalized);
  }

  static isValid(value: string): boolean {
    if (!ISO_DATETIME_UTC_REGEX.test(value)) {
      return false;
    }

    // Guard against JS Date auto-correction (e.g. June 31 silently becoming
    // July 1). Compare parsed UTC components back to the original date part.
    const [year, month, day] = value.slice(0, 10).split("-").map(Number) as [
      number,
      number,
      number,
    ];
    const date = new Date(value);

    return (
      !Number.isNaN(date.getTime()) &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }

  private static normalize(value: string): string {
    return value.trim();
  }

  toUTCDate(): Date {
    return new Date(this.value);
  }

  toIsoDate(): IsoDate {
    return IsoDate.of(this.value.slice(0, 10));
  }

  isBefore(other: IsoDateTime): boolean {
    return this.toUTCDate().getTime() < other.toUTCDate().getTime();
  }

  isAfter(other: IsoDateTime): boolean {
    return this.toUTCDate().getTime() > other.toUTCDate().getTime();
  }

  equals(other: unknown): boolean {
    return other instanceof IsoDateTime && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
