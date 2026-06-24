import { Password, InvalidPasswordError } from "./password.vo.js";

describe("Password", () => {
  const validPassword = "abc1!";

  describe("of", () => {
    it("creates a Password from a valid value", () => {
      const password = Password.of(validPassword);

      expect(password).toBeInstanceOf(Password);
    });

    it("never exposes the plaintext via a public field", () => {
      const password = Password.of(validPassword);

      // @ts-expect-error — value is not a public field on Password
      expect(password.value).toBeUndefined();
    });

    it("throws InvalidPasswordError when value is an empty string", () => {
      expect(() => Password.of("")).toThrow(InvalidPasswordError);
    });

    it("throws InvalidPasswordError with a helpful message for empty input", () => {
      expect(() => Password.of("")).toThrow(
        "Password must be a non-empty string",
      );
    });

    it("throws InvalidPasswordError when value is shorter than 5 characters", () => {
      expect(() => Password.of("ab1!")).toThrow(InvalidPasswordError);
    });

    it("throws InvalidPasswordError with a helpful message for length violations", () => {
      expect(() => Password.of("ab1!")).toThrow(
        "Password must be between 5 and 16 characters",
      );
    });

    it("throws InvalidPasswordError when value is longer than 16 characters", () => {
      const tooLong = "a1!aaaaaaaaaaaaaa";

      expect(() => Password.of(tooLong)).toThrow(InvalidPasswordError);
    });

    it("throws InvalidPasswordError when value has no number", () => {
      expect(() => Password.of("abcde!")).toThrow(InvalidPasswordError);
    });

    it("throws InvalidPasswordError with a helpful message when missing a number", () => {
      expect(() => Password.of("abcde!")).toThrow(
        "Password must contain at least one number",
      );
    });

    it("throws InvalidPasswordError when value has no special character", () => {
      expect(() => Password.of("abcde1")).toThrow(InvalidPasswordError);
    });

    it("throws InvalidPasswordError with a helpful message when missing a special character", () => {
      expect(() => Password.of("abcde1")).toThrow(
        "Password must contain at least one special character",
      );
    });

    it("accepts a value at exactly the minimum length", () => {
      expect(() => Password.of("ab1!c")).not.toThrow();
    });

    it("accepts a value at exactly the maximum length", () => {
      const maxLength = "aaaaaaaaaaaaa1!a";

      expect(maxLength).toHaveLength(16);
      expect(() => Password.of(maxLength)).not.toThrow();
    });

    it("does not trim surrounding whitespace", () => {
      const passwordWithWhitespace = ` ${validPassword} `;

      // Whitespace pushes the length to 7, still within bounds, but the
      // value is no longer equal to the trimmed form once revealed.
      const password = Password.of(passwordWithWhitespace);

      expect(password.revealForHashing()).toBe(passwordWithWhitespace);
    });
  });

  describe("tryParse", () => {
    it("returns a Password instance for a valid value", () => {
      const password = Password.tryParse(validPassword);

      expect(password).not.toBeNull();
      expect(password).toBeInstanceOf(Password);
    });

    it("returns null for an empty string", () => {
      expect(Password.tryParse("")).toBeNull();
    });

    it("returns null when value is too short", () => {
      expect(Password.tryParse("ab1!")).toBeNull();
    });

    it("returns null when value is too long", () => {
      expect(Password.tryParse("a1!aaaaaaaaaaaaaa")).toBeNull();
    });

    it("returns null when value has no number", () => {
      expect(Password.tryParse("abcde!")).toBeNull();
    });

    it("returns null when value has no special character", () => {
      expect(Password.tryParse("abcde1")).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for a valid value", () => {
      expect(Password.isValid(validPassword)).toBe(true);
    });

    it("returns false for a non-string value", () => {
      expect(Password.isValid(12345 as unknown as string)).toBe(false);
    });

    it("returns false for an empty string", () => {
      expect(Password.isValid("")).toBe(false);
    });

    it("returns false when shorter than the minimum length", () => {
      expect(Password.isValid("ab1!")).toBe(false);
    });

    it("returns false when longer than the maximum length", () => {
      expect(Password.isValid("a1!aaaaaaaaaaaaaa")).toBe(false);
    });

    it("returns false when missing a number", () => {
      expect(Password.isValid("abcde!")).toBe(false);
    });

    it("returns false when missing a special character", () => {
      expect(Password.isValid("abcde1")).toBe(false);
    });
  });

  describe("revealForHashing", () => {
    it("returns the original plaintext value", () => {
      const password = Password.of(validPassword);

      expect(password.revealForHashing()).toBe(validPassword);
    });
  });

  describe("equals", () => {
    it("returns true for two Passwords with the same plaintext", () => {
      const first = Password.of(validPassword);
      const second = Password.of(validPassword);

      expect(first.equals(second)).toBe(true);
    });

    it("returns false for two Passwords with different plaintext", () => {
      const first = Password.of(validPassword);
      const second = Password.of("xyz9?");

      expect(first.equals(second)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const password = Password.of(validPassword);

      expect(password.equals(null)).toBe(false);
    });

    it("returns false when compared to undefined", () => {
      const password = Password.of(validPassword);

      expect(password.equals(undefined)).toBe(false);
    });

    it("returns false when compared to a primitive string", () => {
      const password = Password.of(validPassword);

      expect(password.equals(validPassword)).toBe(false);
    });

    it("returns false when compared to a structurally similar non-Password object", () => {
      const password = Password.of(validPassword);

      expect(password.equals({ raw: validPassword })).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns a masked string, never the plaintext", () => {
      const password = Password.of(validPassword);

      expect(password.toString()).toBe("********");
      expect(password.toString()).not.toContain(validPassword);
    });
  });

  describe("toJSON", () => {
    it("returns a masked string, never the plaintext", () => {
      const password = Password.of(validPassword);

      expect(password.toJSON()).toBe("********");
    });

    it("never leaks the plaintext via JSON.stringify", () => {
      const password = Password.of(validPassword);

      expect(JSON.stringify({ password })).not.toContain(validPassword);
      expect(JSON.stringify({ password })).toBe(
        JSON.stringify({ password: "********" }),
      );
    });
  });

  describe("immutability", () => {
    it("freezes the instance", () => {
      const password = Password.of(validPassword);

      expect(Object.isFrozen(password)).toBe(true);
    });
  });
});
