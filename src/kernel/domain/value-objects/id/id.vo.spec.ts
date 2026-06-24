import { Id, InvalidIdError } from "./id.vo.js";

describe("Id", () => {
  const validId = "550e8400-e29b-41d4-a716-446655440000";
  const anotherValidId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

  describe("of", () => {
    it("creates an Id from a non-empty string", () => {
      const id = Id.of(validId);

      expect(id.value).toBe(validId);
    });

    it("preserves the original value", () => {
      const id = Id.of(validId);

      expect(id.toString()).toBe(validId);
    });

    it("accepts any non-empty string including non-UUID formats", () => {
      const id = Id.of("user-123");

      expect(id.value).toBe("user-123");
    });

    it("does not trim surrounding whitespace", () => {
      const idWithWhitespace = ` ${validId} `;

      const id = Id.of(idWithWhitespace);

      expect(id.value).toBe(idWithWhitespace);
    });

    it("throws InvalidIdError when value is an empty string", () => {
      expect(() => Id.of("")).toThrow(InvalidIdError);
    });

    it("throws InvalidIdError when only whitespace is passed", () => {
      expect(() => Id.of("   ")).toThrow(InvalidIdError);
    });

    it("throws InvalidIdError with a helpful message", () => {
      expect(() => Id.of("")).toThrow('Invalid Id: ""');
    });
  });

  describe("parse", () => {
    it("creates an Id from a non-empty string", () => {
      const id = Id.parse(validId);

      expect(id.value).toBe(validId);
    });

    it("trims surrounding whitespace", () => {
      const idWithWhitespace = `  ${validId}  `;

      const id = Id.parse(idWithWhitespace);

      expect(id.value).toBe(validId);
    });

    it("throws InvalidIdError when the trimmed value is empty", () => {
      expect(() => Id.parse("   ")).toThrow(InvalidIdError);
    });

    it("throws InvalidIdError using the original value in the message", () => {
      expect(() => Id.parse("   ")).toThrow('Invalid Id: "   "');
    });
  });

  describe("tryParse", () => {
    it("returns an Id when value is a non-empty string", () => {
      const id = Id.tryParse(validId);

      expect(id).toBeInstanceOf(Id);
      expect(id?.value).toBe(validId);
    });

    it("trims surrounding whitespace", () => {
      const id = Id.tryParse(`  ${validId}  `);

      expect(id?.value).toBe(validId);
    });

    it("returns null when value is an empty string", () => {
      const id = Id.tryParse("");

      expect(id).toBeNull();
    });

    it("returns null when trimmed value is empty", () => {
      const id = Id.tryParse("   ");

      expect(id).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for a non-empty string", () => {
      expect(Id.isValid(validId)).toBe(true);
    });

    it("returns true for any non-empty string format", () => {
      expect(Id.isValid("user-123")).toBe(true);
    });

    it("returns false for an empty string", () => {
      expect(Id.isValid("")).toBe(false);
    });

    it("returns false for a whitespace-only string", () => {
      expect(Id.isValid("   ")).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true when Id values are equal", () => {
      const left = Id.of(validId);
      const right = Id.of(validId);

      expect(left.equals(right)).toBe(true);
    });

    it("returns false when Id values are different", () => {
      const left = Id.of(validId);
      const right = Id.of(anotherValidId);

      expect(left.equals(right)).toBe(false);
    });

    it("compares Id values after parsing normalized input", () => {
      const left = Id.of(validId);
      const right = Id.parse(`  ${validId}  `);

      expect(left.equals(right)).toBe(true);
    });

    it("allows comparing differently branded Ids by value", () => {
      type UserId = Id<"UserId">;
      type AccountId = Id<"AccountId">;

      const userId: UserId = Id.of<"UserId">(validId);
      const accountId: AccountId = Id.of<"AccountId">(validId);

      expect(userId.equals(accountId)).toBe(true);
    });

    it("returns false when compared against null", () => {
      const id = Id.of(validId);

      expect(id.equals(null)).toBe(false);
    });

    it("returns false when compared against undefined", () => {
      const id = Id.of(validId);

      expect(id.equals(undefined)).toBe(false);
    });

    it("returns false when compared against a plain string", () => {
      const id = Id.of(validId);

      expect(id.equals(validId)).toBe(false);
    });

    it("returns false when compared against a structurally similar non-Id object", () => {
      const id = Id.of(validId);
      const impostor = { value: validId };

      expect(id.equals(impostor)).toBe(false);
    });

    it("does not throw when compared against null or undefined", () => {
      const id = Id.of(validId);

      expect(() => id.equals(null)).not.toThrow();
      expect(() => id.equals(undefined)).not.toThrow();
    });
  });

  describe("toString", () => {
    it("returns the Id string value", () => {
      const id = Id.of(validId);

      expect(id.toString()).toBe(validId);
    });

    it("allows String(id) conversion", () => {
      const id = Id.of(validId);

      expect(String(id)).toBe(validId);
    });
  });

  describe("toJSON", () => {
    it("returns the Id string value", () => {
      const id = Id.of(validId);

      expect(id.toJSON()).toBe(validId);
    });

    it("serializes as a string when using JSON.stringify", () => {
      const id = Id.of(validId);

      const json = JSON.stringify({ id });

      expect(json).toBe(`{"id":"${validId}"}`);
    });
  });

  describe("immutability", () => {
    it("freezes the Id instance", () => {
      const id = Id.of(validId);

      expect(Object.isFrozen(id)).toBe(true);
    });

    it("does not allow the value to be reassigned at runtime", () => {
      const id = Id.of(validId);

      expect(() => {
        Object.defineProperty(id, "value", {
          value: anotherValidId,
        });
      }).toThrow();

      expect(id.value).toBe(validId);
    });
  });

  describe("branding", () => {
    it("supports domain-specific branded Id aliases", () => {
      type UserId = Id<"UserId">;

      const userId: UserId = Id.of<"UserId">(validId);

      expect(userId.value).toBe(validId);
    });

    it("does not expose a runtime brand property", () => {
      const id = Id.of<"UserId">(validId);

      expect(Object.keys(id)).toEqual(["value"]);
    });
  });

  describe("InvalidIdError", () => {
    it("extends TypeError", () => {
      const error = new InvalidIdError("invalid");

      expect(error).toBeInstanceOf(TypeError);
    });

    it("sets the error name", () => {
      const error = new InvalidIdError("invalid");

      expect(error.name).toBe("InvalidIdError");
    });

    it("includes the invalid value in the error message", () => {
      const error = new InvalidIdError("");

      expect(error.message).toBe('Invalid Id: ""');
    });
  });
});
