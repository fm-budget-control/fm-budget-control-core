import { IsoDate } from "../iso-date/iso-date.vo.js";
import { IsoDateTime, InvalidIsoDateTimeError } from "./iso-date-time.vo.js";

describe("IsoDateTime", () => {
  const validDateTime = "2026-06-24T12:00:00Z";
  const validDateTimeWithMs = "2026-06-24T12:00:00.123Z";
  const anotherValidDateTime = "2026-06-25T08:30:00Z";

  describe("of", () => {
    it("creates an IsoDateTime from a valid UTC datetime string", () => {
      const dt = IsoDateTime.of(validDateTime);

      expect(dt.value).toBe(validDateTime);
    });

    it("accepts a datetime with milliseconds", () => {
      const dt = IsoDateTime.of(validDateTimeWithMs);

      expect(dt.value).toBe(validDateTimeWithMs);
    });

    it("accepts midnight", () => {
      expect(() => IsoDateTime.of("2026-06-24T00:00:00Z")).not.toThrow();
    });

    it("accepts end-of-day", () => {
      expect(() => IsoDateTime.of("2026-06-24T23:59:59.999Z")).not.toThrow();
    });

    it("does not trim surrounding whitespace", () => {
      expect(() => IsoDateTime.of(` ${validDateTime} `)).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when value is a date-only string", () => {
      expect(() => IsoDateTime.of("2026-06-24")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when Z suffix is missing", () => {
      expect(() => IsoDateTime.of("2026-06-24T12:00:00")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when offset notation is used instead of Z", () => {
      expect(() => IsoDateTime.of("2026-06-24T12:00:00+00:00")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when hour is out of range", () => {
      expect(() => IsoDateTime.of("2026-06-24T25:00:00Z")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when minute is out of range", () => {
      expect(() => IsoDateTime.of("2026-06-24T12:60:00Z")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when month is invalid", () => {
      expect(() => IsoDateTime.of("2026-13-24T12:00:00Z")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when day is invalid", () => {
      expect(() => IsoDateTime.of("2026-06-31T12:00:00Z")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError when value is empty", () => {
      expect(() => IsoDateTime.of("")).toThrow(InvalidIsoDateTimeError);
    });

    it("throws InvalidIsoDateTimeError with a helpful message", () => {
      expect(() => IsoDateTime.of("not-a-datetime")).toThrow(
        'Invalid IsoDateTime: "not-a-datetime"',
      );
    });
  });

  describe("parse", () => {
    it("creates an IsoDateTime from a valid UTC datetime string", () => {
      const dt = IsoDateTime.parse(validDateTime);

      expect(dt.value).toBe(validDateTime);
    });

    it("trims surrounding whitespace", () => {
      const dt = IsoDateTime.parse(`  ${validDateTime}  `);

      expect(dt.value).toBe(validDateTime);
    });

    it("throws InvalidIsoDateTimeError when the trimmed value is invalid", () => {
      expect(() => IsoDateTime.parse("  not-a-datetime  ")).toThrow(
        InvalidIsoDateTimeError,
      );
    });

    it("throws InvalidIsoDateTimeError using the original value in the message", () => {
      expect(() => IsoDateTime.parse("  bad  ")).toThrow(
        'Invalid IsoDateTime: "  bad  "',
      );
    });
  });

  describe("tryParse", () => {
    it("returns an IsoDateTime when value is valid", () => {
      const dt = IsoDateTime.tryParse(validDateTime);

      expect(dt).toBeInstanceOf(IsoDateTime);
      expect(dt?.value).toBe(validDateTime);
    });

    it("trims surrounding whitespace", () => {
      const dt = IsoDateTime.tryParse(`  ${validDateTime}  `);

      expect(dt?.value).toBe(validDateTime);
    });

    it("returns null when value is invalid", () => {
      expect(IsoDateTime.tryParse("not-a-datetime")).toBeNull();
    });

    it("returns null when value is empty", () => {
      expect(IsoDateTime.tryParse("")).toBeNull();
    });

    it("returns null when value is whitespace-only", () => {
      expect(IsoDateTime.tryParse("   ")).toBeNull();
    });

    it("returns null when Z suffix is missing", () => {
      expect(IsoDateTime.tryParse("2026-06-24T12:00:00")).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for a valid UTC datetime", () => {
      expect(IsoDateTime.isValid(validDateTime)).toBe(true);
    });

    it("returns true for a datetime with milliseconds", () => {
      expect(IsoDateTime.isValid(validDateTimeWithMs)).toBe(true);
    });

    it("returns false for a date-only string", () => {
      expect(IsoDateTime.isValid("2026-06-24")).toBe(false);
    });

    it("returns false when Z suffix is missing", () => {
      expect(IsoDateTime.isValid("2026-06-24T12:00:00")).toBe(false);
    });

    it("returns false for a timezone offset string", () => {
      expect(IsoDateTime.isValid("2026-06-24T12:00:00+00:00")).toBe(false);
    });

    it("returns false for an invalid hour", () => {
      expect(IsoDateTime.isValid("2026-06-24T24:00:00Z")).toBe(false);
    });

    it("returns false for an invalid minute", () => {
      expect(IsoDateTime.isValid("2026-06-24T12:60:00Z")).toBe(false);
    });

    it("returns false for an invalid month", () => {
      expect(IsoDateTime.isValid("2026-13-24T12:00:00Z")).toBe(false);
    });

    it("returns false for an invalid day", () => {
      expect(IsoDateTime.isValid("2026-06-31T12:00:00Z")).toBe(false);
    });

    it("returns false for an empty string", () => {
      expect(IsoDateTime.isValid("")).toBe(false);
    });

    it("returns false for a string with surrounding whitespace", () => {
      expect(IsoDateTime.isValid(` ${validDateTime} `)).toBe(false);
    });
  });

  describe("toUTCDate", () => {
    it("returns a Date representing the UTC instant", () => {
      const dt = IsoDateTime.of("2026-06-24T12:00:00Z");
      const date = dt.toUTCDate();

      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(5);
      expect(date.getUTCDate()).toBe(24);
      expect(date.getUTCHours()).toBe(12);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
    });

    it("preserves milliseconds", () => {
      const dt = IsoDateTime.of("2026-06-24T12:00:00.123Z");

      expect(dt.toUTCDate().getUTCMilliseconds()).toBe(123);
    });
  });

  describe("toIsoDate", () => {
    it("returns the calendar date part of the datetime", () => {
      const dt = IsoDateTime.of("2026-06-24T23:59:59Z");

      expect(dt.toIsoDate()).toBeInstanceOf(IsoDate);
      expect(dt.toIsoDate().value).toBe("2026-06-24");
    });

    it("does not shift the date due to timezone", () => {
      const dt = IsoDateTime.of("2026-06-24T00:00:00Z");

      expect(dt.toIsoDate().value).toBe("2026-06-24");
    });
  });

  describe("isBefore", () => {
    it("returns true when this datetime is earlier", () => {
      const earlier = IsoDateTime.of("2026-06-24T10:00:00Z");
      const later = IsoDateTime.of("2026-06-24T11:00:00Z");

      expect(earlier.isBefore(later)).toBe(true);
    });

    it("returns false when this datetime is later", () => {
      const earlier = IsoDateTime.of("2026-06-24T10:00:00Z");
      const later = IsoDateTime.of("2026-06-24T11:00:00Z");

      expect(later.isBefore(earlier)).toBe(false);
    });

    it("returns false when datetimes are equal", () => {
      const dt = IsoDateTime.of(validDateTime);

      expect(dt.isBefore(dt)).toBe(false);
    });
  });

  describe("isAfter", () => {
    it("returns true when this datetime is later", () => {
      const earlier = IsoDateTime.of("2026-06-24T10:00:00Z");
      const later = IsoDateTime.of("2026-06-24T11:00:00Z");

      expect(later.isAfter(earlier)).toBe(true);
    });

    it("returns false when this datetime is earlier", () => {
      const earlier = IsoDateTime.of("2026-06-24T10:00:00Z");
      const later = IsoDateTime.of("2026-06-24T11:00:00Z");

      expect(earlier.isAfter(later)).toBe(false);
    });

    it("returns false when datetimes are equal", () => {
      const dt = IsoDateTime.of(validDateTime);

      expect(dt.isAfter(dt)).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true when datetime values are equal", () => {
      const left = IsoDateTime.of(validDateTime);
      const right = IsoDateTime.of(validDateTime);

      expect(left.equals(right)).toBe(true);
    });

    it("returns false when datetime values differ", () => {
      const left = IsoDateTime.of(validDateTime);
      const right = IsoDateTime.of(anotherValidDateTime);

      expect(left.equals(right)).toBe(false);
    });

    it("returns false for the same instant expressed with and without milliseconds", () => {
      const withoutMs = IsoDateTime.of("2026-06-24T12:00:00Z");
      const withMs = IsoDateTime.of("2026-06-24T12:00:00.000Z");

      expect(withoutMs.equals(withMs)).toBe(false);
    });

    it("returns false when compared against null", () => {
      expect(IsoDateTime.of(validDateTime).equals(null)).toBe(false);
    });

    it("returns false when compared against a plain string", () => {
      expect(IsoDateTime.of(validDateTime).equals(validDateTime)).toBe(false);
    });

    it("does not throw when compared against null or undefined", () => {
      const dt = IsoDateTime.of(validDateTime);

      expect(() => dt.equals(null)).not.toThrow();
      expect(() => dt.equals(undefined)).not.toThrow();
    });
  });

  describe("toString / toJSON", () => {
    it("toString returns the datetime string value", () => {
      expect(IsoDateTime.of(validDateTime).toString()).toBe(validDateTime);
    });

    it("toJSON serialises correctly with JSON.stringify", () => {
      const dt = IsoDateTime.of(validDateTime);

      expect(JSON.stringify({ createdAt: dt })).toBe(
        `{"createdAt":"${validDateTime}"}`,
      );
    });
  });

  describe("immutability", () => {
    it("freezes the instance", () => {
      expect(Object.isFrozen(IsoDateTime.of(validDateTime))).toBe(true);
    });

    it("does not allow value to be reassigned at runtime", () => {
      const dt = IsoDateTime.of(validDateTime);

      expect(() => {
        Object.defineProperty(dt, "value", { value: anotherValidDateTime });
      }).toThrow();

      expect(dt.value).toBe(validDateTime);
    });
  });

  describe("InvalidIsoDateTimeError", () => {
    it("extends TypeError", () => {
      expect(new InvalidIsoDateTimeError("bad")).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      expect(new InvalidIsoDateTimeError("bad").name).toBe(
        "InvalidIsoDateTimeError",
      );
    });

    it("includes the invalid value in the message", () => {
      expect(new InvalidIsoDateTimeError("bad").message).toBe(
        'Invalid IsoDateTime: "bad"',
      );
    });
  });
});
