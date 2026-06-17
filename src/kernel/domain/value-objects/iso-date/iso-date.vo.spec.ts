import { IsoDate, InvalidIsoDateError } from "./iso-date.vo.js";

describe("IsoDate", () => {
  const validDate = "2024-06-15";
  const anotherValidDate = "2024-06-16";

  describe("of", () => {
    it("creates an IsoDate from a canonical YYYY-MM-DD string", () => {
      const date = IsoDate.of(validDate);

      expect(date.value).toBe(validDate);
    });

    it("does not trim surrounding whitespace", () => {
      expect(() => IsoDate.of(` ${validDate} `)).toThrow(InvalidIsoDateError);
    });

    it("throws InvalidIsoDateError when value is not in YYYY-MM-DD format", () => {
      expect(() => IsoDate.of("06/15/2024")).toThrow(InvalidIsoDateError);
    });

    it("throws InvalidIsoDateError with a helpful message", () => {
      expect(() => IsoDate.of("not-a-date")).toThrow(
        'Invalid IsoDate: "not-a-date"',
      );
    });

    it("throws InvalidIsoDateError when value is an empty string", () => {
      expect(() => IsoDate.of("")).toThrow(InvalidIsoDateError);
    });

    it("throws InvalidIsoDateError for a non-existent calendar date (Feb 31)", () => {
      expect(() => IsoDate.of("2024-02-31")).toThrow(InvalidIsoDateError);
    });

    it("throws InvalidIsoDateError for Feb 29 on a non-leap year", () => {
      expect(() => IsoDate.of("2023-02-29")).toThrow(InvalidIsoDateError);
    });

    it("accepts Feb 29 on a leap year", () => {
      const date = IsoDate.of("2024-02-29");

      expect(date.value).toBe("2024-02-29");
    });

    it("throws InvalidIsoDateError for month 13", () => {
      expect(() => IsoDate.of("2024-13-01")).toThrow(InvalidIsoDateError);
    });

    it("throws InvalidIsoDateError for day 00", () => {
      expect(() => IsoDate.of("2024-06-00")).toThrow(InvalidIsoDateError);
    });

    it("throws InvalidIsoDateError for month 00", () => {
      expect(() => IsoDate.of("2024-00-15")).toThrow(InvalidIsoDateError);
    });
  });

  describe("parse", () => {
    it("creates an IsoDate from a canonical YYYY-MM-DD string", () => {
      const date = IsoDate.parse(validDate);

      expect(date.value).toBe(validDate);
    });

    it("trims surrounding whitespace", () => {
      const date = IsoDate.parse(`  ${validDate}  `);

      expect(date.value).toBe(validDate);
    });

    it("throws InvalidIsoDateError when normalized value is not a valid date", () => {
      expect(() => IsoDate.parse("  not-a-date  ")).toThrow(
        InvalidIsoDateError,
      );
    });

    it("throws InvalidIsoDateError using the original invalid value in the message", () => {
      expect(() => IsoDate.parse("  not-a-date  ")).toThrow(
        'Invalid IsoDate: "  not-a-date  "',
      );
    });

    it("throws InvalidIsoDateError for a non-existent date after trimming", () => {
      expect(() => IsoDate.parse("  2024-02-31  ")).toThrow(
        InvalidIsoDateError,
      );
    });
  });

  describe("tryParse", () => {
    it("returns an IsoDate when value is canonical", () => {
      const date = IsoDate.tryParse(validDate);

      expect(date).toBeInstanceOf(IsoDate);
      expect(date?.value).toBe(validDate);
    });

    it("trims surrounding whitespace", () => {
      const date = IsoDate.tryParse(`  ${validDate}  `);

      expect(date?.value).toBe(validDate);
    });

    it("returns null when value is not a valid date", () => {
      expect(IsoDate.tryParse("not-a-date")).toBeNull();
    });

    it("returns null when value is an empty string", () => {
      expect(IsoDate.tryParse("")).toBeNull();
    });

    it("returns null for a non-existent calendar date", () => {
      expect(IsoDate.tryParse("2024-02-31")).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for a canonical YYYY-MM-DD string", () => {
      expect(IsoDate.isValid(validDate)).toBe(true);
    });

    it("returns false for a value with surrounding whitespace", () => {
      expect(IsoDate.isValid(` ${validDate} `)).toBe(false);
    });

    it("returns false for a non-existent calendar date", () => {
      expect(IsoDate.isValid("2024-02-31")).toBe(false);
    });

    it("returns true for the last day of a leap year February", () => {
      expect(IsoDate.isValid("2024-02-29")).toBe(true);
    });

    it("returns false for Feb 29 on a non-leap year", () => {
      expect(IsoDate.isValid("2023-02-29")).toBe(false);
    });

    it("returns true for a century leap year (2000)", () => {
      expect(IsoDate.isValid("2000-02-29")).toBe(true);
    });

    it("returns false for a non-leap century year (1900)", () => {
      expect(IsoDate.isValid("1900-02-29")).toBe(false);
    });
  });

  describe("toUTCDate", () => {
    it("returns a Date at UTC midnight for the given calendar date", () => {
      const date = IsoDate.of(validDate);

      const utcDate = date.toUTCDate();

      expect(utcDate.getUTCFullYear()).toBe(2024);
      expect(utcDate.getUTCMonth()).toBe(5); // 0-indexed -> June
      expect(utcDate.getUTCDate()).toBe(15);
      expect(utcDate.getUTCHours()).toBe(0);
    });

    /**
     * Regression test for the original bug: isAbove18 (and any other
     * caller) must not rely on local Date getters, since those are
     * sensitive to the host's TZ and can misread the date near midnight
     * in negative-offset zones. This test pins TZ to a negative-offset
     * zone via process.env and confirms the UTC getters on the returned
     * Date are unaffected, even though local getters would not be.
     */
    it("is unaffected by the host's TZ for a leap-year boundary date", () => {
      const originalTz = process.env.TZ;
      process.env.TZ = "Pacific/Honolulu"; // UTC-10, exposes the bug

      try {
        const date = IsoDate.of("2024-02-29");
        const utcDate = date.toUTCDate();

        // UTC getters: must read the 29th regardless of host TZ.
        expect(utcDate.getUTCFullYear()).toBe(2024);
        expect(utcDate.getUTCMonth()).toBe(1);
        expect(utcDate.getUTCDate()).toBe(29);
      } finally {
        process.env.TZ = originalTz;
      }
    });
  });

  describe("toDaysSinceEpoch", () => {
    it("returns 0 for the epoch date itself", () => {
      const date = IsoDate.of("1970-01-01");

      expect(date.toDaysSinceEpoch()).toBe(0);
    });

    it("returns the correct day count for a known date", () => {
      const date = IsoDate.of("1970-01-02");

      expect(date.toDaysSinceEpoch()).toBe(1);
    });

    it("is consistent across a leap day boundary", () => {
      const beforeLeapDay = IsoDate.of("2024-02-28");
      const leapDay = IsoDate.of("2024-02-29");
      const afterLeapDay = IsoDate.of("2024-03-01");

      expect(leapDay.toDaysSinceEpoch() - beforeLeapDay.toDaysSinceEpoch()).toBe(1);
      expect(afterLeapDay.toDaysSinceEpoch() - leapDay.toDaysSinceEpoch()).toBe(1);
    });
  });

  describe("equals", () => {
    it("returns true when values are equal", () => {
      const left = IsoDate.of(validDate);
      const right = IsoDate.of(validDate);

      expect(left.equals(right)).toBe(true);
    });

    it("returns false when values are different", () => {
      const left = IsoDate.of(validDate);
      const right = IsoDate.of(anotherValidDate);

      expect(left.equals(right)).toBe(false);
    });

    it("returns false when compared against null", () => {
      const date = IsoDate.of(validDate);

      expect(date.equals(null)).toBe(false);
    });

    it("returns false when compared against undefined", () => {
      const date = IsoDate.of(validDate);

      expect(date.equals(undefined)).toBe(false);
    });

    it("returns false when compared against a plain string", () => {
      const date = IsoDate.of(validDate);

      expect(date.equals(validDate)).toBe(false);
    });

    it("returns false when compared against a structurally similar non-IsoDate object", () => {
      const date = IsoDate.of(validDate);
      const impostor = { value: validDate };

      expect(date.equals(impostor)).toBe(false);
    });

    it("does not throw when compared against null or undefined", () => {
      const date = IsoDate.of(validDate);

      expect(() => date.equals(null)).not.toThrow();
      expect(() => date.equals(undefined)).not.toThrow();
    });
  });

  describe("isBefore / isAfter", () => {
    it("returns true from isBefore when this date is earlier", () => {
      const earlier = IsoDate.of(validDate);
      const later = IsoDate.of(anotherValidDate);

      expect(earlier.isBefore(later)).toBe(true);
      expect(later.isBefore(earlier)).toBe(false);
    });

    it("returns true from isAfter when this date is later", () => {
      const earlier = IsoDate.of(validDate);
      const later = IsoDate.of(anotherValidDate);

      expect(later.isAfter(earlier)).toBe(true);
      expect(earlier.isAfter(later)).toBe(false);
    });

    it("returns false for both isBefore and isAfter when dates are equal", () => {
      const left = IsoDate.of(validDate);
      const right = IsoDate.of(validDate);

      expect(left.isBefore(right)).toBe(false);
      expect(left.isAfter(right)).toBe(false);
    });

    it("correctly orders dates across a leap day boundary regardless of host TZ", () => {
      const originalTz = process.env.TZ;
      process.env.TZ = "Pacific/Honolulu";

      try {
        const beforeLeapDay = IsoDate.of("2024-02-28");
        const leapDay = IsoDate.of("2024-02-29");

        expect(beforeLeapDay.isBefore(leapDay)).toBe(true);
        expect(leapDay.isAfter(beforeLeapDay)).toBe(true);
      } finally {
        process.env.TZ = originalTz;
      }
    });
  });

  describe("toString", () => {
    it("returns the date string value", () => {
      const date = IsoDate.of(validDate);

      expect(date.toString()).toBe(validDate);
    });

    it("allows String(date) conversion", () => {
      const date = IsoDate.of(validDate);

      expect(String(date)).toBe(validDate);
    });
  });

  describe("toJSON", () => {
    it("returns the date string value", () => {
      const date = IsoDate.of(validDate);

      expect(date.toJSON()).toBe(validDate);
    });

    it("serializes as a string when using JSON.stringify", () => {
      const date = IsoDate.of(validDate);

      const json = JSON.stringify({ birthDate: date });

      expect(json).toBe(`{"birthDate":"${validDate}"}`);
    });
  });

  describe("immutability", () => {
    it("freezes the IsoDate instance", () => {
      const date = IsoDate.of(validDate);

      expect(Object.isFrozen(date)).toBe(true);
    });

    it("does not allow the value to be reassigned at runtime", () => {
      const date = IsoDate.of(validDate);

      expect(() => {
        Object.defineProperty(date, "value", {
          value: anotherValidDate,
        });
      }).toThrow();

      expect(date.value).toBe(validDate);
    });
  });

  describe("InvalidIsoDateError", () => {
    it("extends TypeError", () => {
      const error = new InvalidIsoDateError("invalid");

      expect(error).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      const error = new InvalidIsoDateError("invalid");

      expect(error.name).toBe("InvalidIsoDateError");
    });

    it("includes the invalid value in the error message", () => {
      const error = new InvalidIsoDateError("invalid");

      expect(error.message).toBe('Invalid IsoDate: "invalid"');
    });
  });
});