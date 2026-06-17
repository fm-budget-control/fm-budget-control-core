import { Uuid, InvalidUuidError } from "./uuid.vo.js"

describe("Uuid", () => {
  const validUuidV4 = "550e8400-e29b-41d4-a716-446655440000";
  const anotherValidUuidV4 = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

  describe("of", () => {
    it("creates a UUID from a canonical UUID v4 string", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.value).toBe(validUuidV4);
    });

    it("preserves the original canonical value", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.toString()).toBe(validUuidV4);
    });

    it("does not normalize uppercase UUID values", () => {
      const uppercaseUuid = "550E8400-E29B-41D4-A716-446655440000";

      expect(() => Uuid.of(uppercaseUuid)).toThrow(InvalidUuidError);
    });

    it("does not trim surrounding whitespace", () => {
      const uuidWithWhitespace = ` ${validUuidV4} `;

      expect(() => Uuid.of(uuidWithWhitespace)).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when value is not a UUID", () => {
      expect(() => Uuid.of("not-a-uuid")).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError with a helpful message", () => {
      expect(() => Uuid.of("not-a-uuid")).toThrow(
        'Invalid UUIDv4: "not-a-uuid"',
      );
    });

    it("throws InvalidUuidError when value is an empty string", () => {
      expect(() => Uuid.of("")).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when value is only whitespace", () => {
      expect(() => Uuid.of("   ")).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when UUID version is not v4", () => {
      const uuidV1 = "550e8400-e29b-11d4-a716-446655440000";

      expect(() => Uuid.of(uuidV1)).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when UUID variant is invalid", () => {
      const invalidVariantUuid = "550e8400-e29b-41d4-c716-446655440000";

      expect(() => Uuid.of(invalidVariantUuid)).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when UUID has missing hyphens", () => {
      const uuidWithoutHyphens = "550e8400e29b41d4a716446655440000";

      expect(() => Uuid.of(uuidWithoutHyphens)).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when UUID contains non-hexadecimal characters", () => {
      const invalidHexUuid = "zz0e8400-e29b-41d4-a716-446655440000";

      expect(() => Uuid.of(invalidHexUuid)).toThrow(InvalidUuidError);
    });
  });

  describe("parse", () => {
    it("creates a UUID from a canonical UUID v4 string", () => {
      const uuid = Uuid.parse(validUuidV4);

      expect(uuid.value).toBe(validUuidV4);
    });

    it("normalizes uppercase UUID values to lowercase", () => {
      const uppercaseUuid = "550E8400-E29B-41D4-A716-446655440000";

      const uuid = Uuid.parse(uppercaseUuid);

      expect(uuid.value).toBe(validUuidV4);
    });

    it("trims surrounding whitespace", () => {
      const uuidWithWhitespace = `  ${validUuidV4}  `;

      const uuid = Uuid.parse(uuidWithWhitespace);

      expect(uuid.value).toBe(validUuidV4);
    });

    it("trims and lowercases the UUID before validation", () => {
      const externalUuid = "  550E8400-E29B-41D4-A716-446655440000  ";

      const uuid = Uuid.parse(externalUuid);

      expect(uuid.value).toBe(validUuidV4);
    });

    it("throws InvalidUuidError when normalized value is not a UUID", () => {
      expect(() => Uuid.parse("not-a-uuid")).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError using the original invalid value in the message", () => {
      expect(() => Uuid.parse("  not-a-uuid  ")).toThrow(
        'Invalid UUIDv4: "  not-a-uuid  "',
      );
    });

    it("throws InvalidUuidError when normalized UUID version is not v4", () => {
      const uuidV1 = "  550E8400-E29B-11D4-A716-446655440000  ";

      expect(() => Uuid.parse(uuidV1)).toThrow(InvalidUuidError);
    });

    it("throws InvalidUuidError when normalized UUID variant is invalid", () => {
      const invalidVariantUuid = "  550E8400-E29B-41D4-C716-446655440000  ";

      expect(() => Uuid.parse(invalidVariantUuid)).toThrow(InvalidUuidError);
    });
  });

  describe("tryParse", () => {
    it("returns a UUID when value is a canonical UUID v4 string", () => {
      const uuid = Uuid.tryParse(validUuidV4);

      expect(uuid).toBeInstanceOf(Uuid);
      expect(uuid?.value).toBe(validUuidV4);
    });

    it("normalizes uppercase UUID values to lowercase", () => {
      const uuid = Uuid.tryParse("550E8400-E29B-41D4-A716-446655440000");

      expect(uuid?.value).toBe(validUuidV4);
    });

    it("trims surrounding whitespace", () => {
      const uuid = Uuid.tryParse(`  ${validUuidV4}  `);

      expect(uuid?.value).toBe(validUuidV4);
    });

    it("returns null when value is not a UUID", () => {
      const uuid = Uuid.tryParse("not-a-uuid");

      expect(uuid).toBeNull();
    });

    it("returns null when value is an empty string", () => {
      const uuid = Uuid.tryParse("");

      expect(uuid).toBeNull();
    });

    it("returns null when value is only whitespace", () => {
      const uuid = Uuid.tryParse("   ");

      expect(uuid).toBeNull();
    });

    it("returns null when UUID version is not v4", () => {
      const uuidV1 = "550e8400-e29b-11d4-a716-446655440000";

      const uuid = Uuid.tryParse(uuidV1);

      expect(uuid).toBeNull();
    });

    it("returns null when UUID variant is invalid", () => {
      const invalidVariantUuid = "550e8400-e29b-41d4-c716-446655440000";

      const uuid = Uuid.tryParse(invalidVariantUuid);

      expect(uuid).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for a canonical UUID v4 string", () => {
      expect(Uuid.isValid(validUuidV4)).toBe(true);
    });

    it("returns false for uppercase UUID values", () => {
      expect(Uuid.isValid("550E8400-E29B-41D4-A716-446655440000")).toBe(false);
    });

    it("returns false for UUID values with surrounding whitespace", () => {
      expect(Uuid.isValid(` ${validUuidV4} `)).toBe(false);
    });

    it("returns false for non-UUID strings", () => {
      expect(Uuid.isValid("not-a-uuid")).toBe(false);
    });

    it("returns false for UUID v1", () => {
      expect(Uuid.isValid("550e8400-e29b-11d4-a716-446655440000")).toBe(false);
    });

    it("returns false for UUID v3", () => {
      expect(Uuid.isValid("550e8400-e29b-31d4-a716-446655440000")).toBe(false);
    });

    it("returns false for UUID v5", () => {
      expect(Uuid.isValid("550e8400-e29b-51d4-a716-446655440000")).toBe(false);
    });

    it("returns true for UUID v4 with variant 8", () => {
      expect(Uuid.isValid("550e8400-e29b-41d4-8716-446655440000")).toBe(true);
    });

    it("returns true for UUID v4 with variant 9", () => {
      expect(Uuid.isValid("550e8400-e29b-41d4-9716-446655440000")).toBe(true);
    });

    it("returns true for UUID v4 with variant a", () => {
      expect(Uuid.isValid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("returns true for UUID v4 with variant b", () => {
      expect(Uuid.isValid("550e8400-e29b-41d4-b716-446655440000")).toBe(true);
    });

    it("returns false for UUID v4 with variant c", () => {
      expect(Uuid.isValid("550e8400-e29b-41d4-c716-446655440000")).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true when UUID values are equal", () => {
      const left = Uuid.of(validUuidV4);
      const right = Uuid.of(validUuidV4);

      expect(left.equals(right)).toBe(true);
    });

    it("returns false when UUID values are different", () => {
      const left = Uuid.of(validUuidV4);
      const right = Uuid.of(anotherValidUuidV4);

      expect(left.equals(right)).toBe(false);
    });

    it("compares UUID values after parsing normalized input", () => {
      const left = Uuid.of(validUuidV4);
      const right = Uuid.parse("550E8400-E29B-41D4-A716-446655440000");

      expect(left.equals(right)).toBe(true);
    });

    it("allows comparing differently branded UUIDs by value", () => {
      type UserId = Uuid<"UserId">;
      type AccountId = Uuid<"AccountId">;

      const userId: UserId = Uuid.of<"UserId">(validUuidV4);
      const accountId: AccountId = Uuid.of<"AccountId">(validUuidV4);

      expect(userId.equals(accountId)).toBe(true);
    });

    it("returns false when compared against null", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.equals(null)).toBe(false);
    });

    it("returns false when compared against undefined", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.equals(undefined)).toBe(false);
    });

    it("returns false when compared against a plain string", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.equals(validUuidV4)).toBe(false);
    });

    it("returns false when compared against a structurally similar non-Uuid object", () => {
      const uuid = Uuid.of(validUuidV4);
      const impostor = { value: validUuidV4 };

      expect(uuid.equals(impostor)).toBe(false);
    });

    it("does not throw when compared against null or undefined", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(() => uuid.equals(null)).not.toThrow();
      expect(() => uuid.equals(undefined)).not.toThrow();
    });
  });

  describe("toString", () => {
    it("returns the UUID string value", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.toString()).toBe(validUuidV4);
    });

    it("allows String(uuid) conversion", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(String(uuid)).toBe(validUuidV4);
    });
  });

  describe("toJSON", () => {
    it("returns the UUID string value", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(uuid.toJSON()).toBe(validUuidV4);
    });

    it("serializes as a string when using JSON.stringify", () => {
      const uuid = Uuid.of(validUuidV4);

      const json = JSON.stringify({ id: uuid });

      expect(json).toBe(`{"id":"${validUuidV4}"}`);
    });
  });

  describe("immutability", () => {
    it("freezes the UUID instance", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(Object.isFrozen(uuid)).toBe(true);
    });

    it("does not allow the value to be reassigned at runtime", () => {
      const uuid = Uuid.of(validUuidV4);

      expect(() => {
        Object.defineProperty(uuid, "value", {
          value: anotherValidUuidV4,
        });
      }).toThrow();

      expect(uuid.value).toBe(validUuidV4);
    });
  });

  describe("branding", () => {
    it("supports domain-specific branded UUID aliases", () => {
      type UserId = Uuid<"UserId">;

      const userId: UserId = Uuid.of<"UserId">(validUuidV4);

      expect(userId.value).toBe(validUuidV4);
    });

    it("does not expose a runtime brand property", () => {
      const uuid = Uuid.of<"UserId">(validUuidV4);

      expect(Object.keys(uuid)).toEqual(["value"]);
    });
  });

  describe("InvalidUuidError", () => {
    it("extends TypeError", () => {
      const error = new InvalidUuidError("invalid");

      expect(error).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      const error = new InvalidUuidError("invalid");

      expect(error.name).toBe("InvalidUuidError");
    });

    it("includes the invalid value in the error message", () => {
      const error = new InvalidUuidError("invalid");

      expect(error.message).toBe('Invalid UUIDv4: "invalid"');
    });
  });
});