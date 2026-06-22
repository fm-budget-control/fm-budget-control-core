import { FullName, InvalidFullNameError } from "./full-name.vo.js";

describe("FullName", () => {
  const validFullName = "Fabio Reis";

  describe("of", () => {
    it("creates a FullName from an already-normalized value", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.value).toBe(validFullName);
    });

    it("preserves the original value", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.toString()).toBe(validFullName);
    });

    it("accepts accented Unicode letters", () => {
      const fullName = FullName.of("José da Silva");

      expect(fullName.value).toBe("José da Silva");
    });

    it("accepts hyphenated names", () => {
      const fullName = FullName.of("Anne-Marie Dupont");

      expect(fullName.value).toBe("Anne-Marie Dupont");
    });

    it("accepts names with apostrophes", () => {
      const fullName = FullName.of("Anne-Marie O'Brien");

      expect(fullName.value).toBe("Anne-Marie O'Brien");
    });

    it("does not trim surrounding whitespace", () => {
      const nameWithWhitespace = ` ${validFullName} `;

      expect(() => FullName.of(nameWithWhitespace)).toThrow(
        InvalidFullNameError,
      );
    });

    it("does not collapse repeated internal whitespace", () => {
      const nameWithDoubleSpace = "Fabio  Reis";

      expect(() => FullName.of(nameWithDoubleSpace)).toThrow(
        InvalidFullNameError,
      );
    });

    it("throws InvalidFullNameError when value is shorter than 3 characters", () => {
      expect(() => FullName.of("ab")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError with a helpful message", () => {
      expect(() => FullName.of("ab")).toThrow('Invalid full name: "ab"');
    });

    it("throws InvalidFullNameError when value is an empty string", () => {
      expect(() => FullName.of("")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError when value has no space (single name only)", () => {
      expect(() => FullName.of("Madonna")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError when value contains digits", () => {
      expect(() => FullName.of("John123 Doe")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError when value contains symbols", () => {
      expect(() => FullName.of("John! Doe")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError when value is only whitespace", () => {
      expect(() => FullName.of("   ")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError when value exceeds 100 characters", () => {
      const firstPart = "a".repeat(50);
      const secondPart = "b".repeat(50);
      const oversizedName = `${firstPart} ${secondPart}`;

      expect(() => FullName.of(oversizedName)).toThrow(InvalidFullNameError);
    });

    it("accepts a value at exactly 100 characters", () => {
      const firstPart = "a".repeat(50);
      const secondPart = "b".repeat(49);
      const maxLengthName = `${firstPart} ${secondPart}`;

      expect(maxLengthName.length).toBe(100);
      expect(() => FullName.of(maxLengthName)).not.toThrow();
    });
  });

  describe("parse", () => {
    it("creates a FullName from an already-normalized value", () => {
      const fullName = FullName.parse(validFullName);

      expect(fullName.value).toBe(validFullName);
    });

    it("trims surrounding whitespace", () => {
      const fullName = FullName.parse(` ${validFullName} `);

      expect(fullName.value).toBe(validFullName);
    });

    it("collapses repeated internal whitespace", () => {
      const fullName = FullName.parse("Fabio   Reis");

      expect(fullName.value).toBe(validFullName);
    });

    it("trims and collapses whitespace at the same time", () => {
      const fullName = FullName.parse("  Fabio   Reis  ");

      expect(fullName.value).toBe(validFullName);
    });

    it("throws InvalidFullNameError when value has no space after normalization", () => {
      expect(() => FullName.parse("  Madonna  ")).toThrow(InvalidFullNameError);
    });

    it("throws InvalidFullNameError using the original unnormalized value in the message", () => {
      expect(() => FullName.parse("  Madonna  ")).toThrow(
        'Invalid full name: "  Madonna  "',
      );
    });

    it("throws InvalidFullNameError when value is only whitespace", () => {
      expect(() => FullName.parse("   ")).toThrow(InvalidFullNameError);
    });
  });

  describe("tryParse", () => {
    it("returns a FullName instance for a valid value", () => {
      const fullName = FullName.tryParse("  Fabio   Reis  ");

      expect(fullName).not.toBeNull();
      expect(fullName?.value).toBe(validFullName);
    });

    it("returns null for a single name with no space", () => {
      expect(FullName.tryParse("Madonna")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(FullName.tryParse("")).toBeNull();
    });

    it("returns null for a value containing digits", () => {
      expect(FullName.tryParse("John123 Doe")).toBeNull();
    });

    it("returns null for a value exceeding the max length after normalization", () => {
      const firstPart = "a".repeat(50);
      const secondPart = "b".repeat(50);

      expect(FullName.tryParse(`${firstPart}   ${secondPart}`)).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for an already-normalized valid value", () => {
      expect(FullName.isValid(validFullName)).toBe(true);
    });

    it("returns false for a value with surrounding whitespace", () => {
      expect(FullName.isValid(` ${validFullName} `)).toBe(false);
    });

    it("returns false for a value with repeated internal whitespace", () => {
      expect(FullName.isValid("Fabio  Reis")).toBe(false);
    });

    it("returns false for a single name with no space", () => {
      expect(FullName.isValid("Madonna")).toBe(false);
    });

    it("returns false for a value shorter than 3 characters", () => {
      expect(FullName.isValid("ab")).toBe(false);
    });

    it("returns false for a value containing digits", () => {
      expect(FullName.isValid("John123 Doe")).toBe(false);
    });

    it("returns true for a value with accented Unicode letters", () => {
      expect(FullName.isValid("José da Silva")).toBe(true);
    });
  });

  describe("equals", () => {
    it("returns true for two FullNames with the same value", () => {
      const first = FullName.of(validFullName);
      const second = FullName.of(validFullName);

      expect(first.equals(second)).toBe(true);
    });

    it("returns false for two FullNames with different values", () => {
      const first = FullName.of(validFullName);
      const second = FullName.of("Other Name");

      expect(first.equals(second)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.equals(null)).toBe(false);
    });

    it("returns false when compared to undefined", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.equals(undefined)).toBe(false);
    });

    it("returns false when compared to a primitive string", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.equals(validFullName)).toBe(false);
    });

    it("returns false when compared to a structurally similar non-FullName object", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.equals({ value: validFullName })).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns the underlying value", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.toString()).toBe(validFullName);
    });
  });

  describe("toJSON", () => {
    it("returns the underlying value", () => {
      const fullName = FullName.of(validFullName);

      expect(fullName.toJSON()).toBe(validFullName);
    });

    it("serializes correctly via JSON.stringify", () => {
      const fullName = FullName.of(validFullName);

      expect(JSON.stringify({ fullName })).toBe(
        JSON.stringify({ fullName: validFullName }),
      );
    });
  });

  describe("immutability", () => {
    it("freezes the instance", () => {
      const fullName = FullName.of(validFullName);

      expect(Object.isFrozen(fullName)).toBe(true);
    });

    it("does not allow reassigning value", () => {
      const fullName = FullName.of(validFullName);

      expect(() => {
        // @ts-expect-error — value is readonly
        fullName.value = "Other Name";
      }).toThrow();
    });
  });
});
