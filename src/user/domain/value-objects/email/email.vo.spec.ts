import { Email, InvalidEmailError } from "./email.vo.js";

describe("Email", () => {
  const validEmail = "fabio@example.com";

  describe("of", () => {
    it("creates an Email from an already-normalized address", () => {
      const email = Email.of(validEmail);

      expect(email.value).toBe(validEmail);
    });

    it("preserves the original value", () => {
      const email = Email.of(validEmail);

      expect(email.toString()).toBe(validEmail);
    });

    it("does not lowercase uppercase addresses", () => {
      const uppercaseEmail = "FABIO@EXAMPLE.COM";

      expect(() => Email.of(uppercaseEmail)).toThrow(InvalidEmailError);
    });

    it("does not trim surrounding whitespace", () => {
      const emailWithWhitespace = ` ${validEmail} `;

      expect(() => Email.of(emailWithWhitespace)).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when value has no @", () => {
      expect(() => Email.of("not-an-email")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError with a helpful message", () => {
      expect(() => Email.of("not-an-email")).toThrow(
        'Invalid email address: "not-an-email"',
      );
    });

    it("throws InvalidEmailError when value is an empty string", () => {
      expect(() => Email.of("")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when value has no domain", () => {
      expect(() => Email.of("fabio@")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when value has no local part", () => {
      expect(() => Email.of("@example.com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when domain has no top-level domain", () => {
      expect(() => Email.of("fabio@example")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when value contains spaces", () => {
      expect(() => Email.of("fabio reis@example.com")).toThrow(
        InvalidEmailError,
      );
    });

    it("throws InvalidEmailError when value contains tabs", () => {
      expect(() => Email.of("fabio\treis@example.com")).toThrow(
        InvalidEmailError,
      );
    });

    it("throws InvalidEmailError when value contains multiple @", () => {
      expect(() => Email.of("fabio@@example.com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when value exceeds 254 characters", () => {
      const oversizedEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(
        63,
      )}.${"d".repeat(62)}`;

      expect(oversizedEmail).toHaveLength(255);
      expect(() => Email.of(oversizedEmail)).toThrow(InvalidEmailError);
    });

    it("accepts a value at exactly 254 characters", () => {
      const maxLengthEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(
        63,
      )}.${"d".repeat(61)}`;

      expect(maxLengthEmail).toHaveLength(254);
      expect(() => Email.of(maxLengthEmail)).not.toThrow();
    });

    it("throws InvalidEmailError when local part exceeds 64 characters", () => {
      const email = `${"a".repeat(65)}@example.com`;

      expect(() => Email.of(email)).toThrow(InvalidEmailError);
    });

    it("accepts local part with exactly 64 characters", () => {
      const email = `${"a".repeat(64)}@example.com`;

      expect(() => Email.of(email)).not.toThrow();
    });

    it("throws InvalidEmailError when local part starts with a dot", () => {
      expect(() => Email.of(".fabio@example.com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when local part ends with a dot", () => {
      expect(() => Email.of("fabio.@example.com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when local part contains consecutive dots", () => {
      expect(() => Email.of("fabio..reis@example.com")).toThrow(
        InvalidEmailError,
      );
    });

    it("accepts allowed local part symbols", () => {
      expect(() => Email.of("fabio.reis+test@example.com")).not.toThrow();
    });

    it("throws InvalidEmailError when domain label starts with a hyphen", () => {
      expect(() => Email.of("fabio@-example.com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when domain label ends with a hyphen", () => {
      expect(() => Email.of("fabio@example-.com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when domain contains an empty label", () => {
      expect(() => Email.of("fabio@example..com")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when domain label exceeds 63 characters", () => {
      const email = `fabio@${"a".repeat(64)}.com`;

      expect(() => Email.of(email)).toThrow(InvalidEmailError);
    });

    it("accepts domain label with exactly 63 characters", () => {
      const email = `fabio@${"a".repeat(63)}.com`;

      expect(() => Email.of(email)).not.toThrow();
    });
  });

  describe("parse", () => {
    it("creates an Email from an already-normalized address", () => {
      const email = Email.parse(validEmail);

      expect(email.value).toBe(validEmail);
    });

    it("trims surrounding whitespace", () => {
      const email = Email.parse(` ${validEmail} `);

      expect(email.value).toBe(validEmail);
    });

    it("lowercases uppercase addresses", () => {
      const email = Email.parse("FABIO@EXAMPLE.COM");

      expect(email.value).toBe(validEmail);
    });

    it("trims and lowercases at the same time", () => {
      const email = Email.parse(" FABIO@EXAMPLE.COM ");

      expect(email.value).toBe(validEmail);
    });

    it("throws InvalidEmailError when value is not a valid email", () => {
      expect(() => Email.parse("not-an-email")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError using the original unnormalized value in the message", () => {
      expect(() => Email.parse(" NOT-AN-EMAIL ")).toThrow(
        'Invalid email address: " NOT-AN-EMAIL "',
      );
    });

    it("throws InvalidEmailError when value is only whitespace", () => {
      expect(() => Email.parse("   ")).toThrow(InvalidEmailError);
    });

    it("throws InvalidEmailError when normalized value exceeds local part length", () => {
      const email = ` ${"A".repeat(65)}@EXAMPLE.COM `;

      expect(() => Email.parse(email)).toThrow(InvalidEmailError);
    });
  });

  describe("tryParse", () => {
    it("returns an Email instance for a valid address", () => {
      const email = Email.tryParse(" FABIO@EXAMPLE.COM ");

      expect(email).not.toBeNull();
      expect(email?.value).toBe(validEmail);
    });

    it("returns null for an invalid address", () => {
      expect(Email.tryParse("not-an-email")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(Email.tryParse("")).toBeNull();
    });

    it("returns null for a value exceeding the max length after normalization", () => {
      const oversizedEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(
        63,
      )}.${"d".repeat(62)}`;

      expect(Email.tryParse(oversizedEmail)).toBeNull();
    });

    it("returns null when local part exceeds 64 characters after normalization", () => {
      const email = ` ${"A".repeat(65)}@EXAMPLE.COM `;

      expect(Email.tryParse(email)).toBeNull();
    });
  });

  describe("isValid", () => {
    it("returns true for an already-normalized valid address", () => {
      expect(Email.isValid(validEmail)).toBe(true);
    });

    it("returns false for an uppercase address", () => {
      expect(Email.isValid("FABIO@EXAMPLE.COM")).toBe(false);
    });

    it("returns false for a value with surrounding whitespace", () => {
      expect(Email.isValid(` ${validEmail} `)).toBe(false);
    });

    it("returns false for a value without @", () => {
      expect(Email.isValid("not-an-email")).toBe(false);
    });

    it("returns false for a value exceeding 254 characters", () => {
      const oversizedEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(
        63,
      )}.${"d".repeat(62)}`;

      expect(Email.isValid(oversizedEmail)).toBe(false);
    });

    it("returns false when local part exceeds 64 characters", () => {
      expect(Email.isValid(`${"a".repeat(65)}@example.com`)).toBe(false);
    });

    it("returns false when local part starts with a dot", () => {
      expect(Email.isValid(".fabio@example.com")).toBe(false);
    });

    it("returns false when local part ends with a dot", () => {
      expect(Email.isValid("fabio.@example.com")).toBe(false);
    });

    it("returns false when local part contains consecutive dots", () => {
      expect(Email.isValid("fabio..reis@example.com")).toBe(false);
    });

    it("returns false when domain label starts with a hyphen", () => {
      expect(Email.isValid("fabio@-example.com")).toBe(false);
    });

    it("returns false when domain label ends with a hyphen", () => {
      expect(Email.isValid("fabio@example-.com")).toBe(false);
    });

    it("returns false when domain contains an empty label", () => {
      expect(Email.isValid("fabio@example..com")).toBe(false);
    });

    it("returns false when domain label exceeds 63 characters", () => {
      expect(Email.isValid(`fabio@${"a".repeat(64)}.com`)).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true for two Emails with the same value", () => {
      const first = Email.of(validEmail);
      const second = Email.of(validEmail);

      expect(first.equals(second)).toBe(true);
    });

    it("returns false for two Emails with different values", () => {
      const first = Email.of(validEmail);
      const second = Email.of("other@example.com");

      expect(first.equals(second)).toBe(false);
    });

    it("returns false when compared to null", () => {
      const email = Email.of(validEmail);

      expect(email.equals(null)).toBe(false);
    });

    it("returns false when compared to undefined", () => {
      const email = Email.of(validEmail);

      expect(email.equals(undefined)).toBe(false);
    });

    it("returns false when compared to a primitive string", () => {
      const email = Email.of(validEmail);

      expect(email.equals(validEmail)).toBe(false);
    });

    it("returns false when compared to a structurally similar non-Email object", () => {
      const email = Email.of(validEmail);

      expect(email.equals({ value: validEmail })).toBe(false);
    });
  });

  describe("toString", () => {
    it("returns the underlying value", () => {
      const email = Email.of(validEmail);

      expect(email.toString()).toBe(validEmail);
    });
  });

  describe("toJSON", () => {
    it("returns the underlying value", () => {
      const email = Email.of(validEmail);

      expect(email.toJSON()).toBe(validEmail);
    });

    it("serializes correctly via JSON.stringify", () => {
      const email = Email.of(validEmail);

      expect(JSON.stringify({ email })).toBe(
        JSON.stringify({ email: validEmail }),
      );
    });
  });

  describe("immutability", () => {
    it("freezes the instance", () => {
      const email = Email.of(validEmail);

      expect(Object.isFrozen(email)).toBe(true);
    });

    it("does not allow reassigning value", () => {
      const email = Email.of(validEmail);

      expect(() => {
        // @ts-expect-error — value is readonly
        email.value = "other@example.com";
      }).toThrow();
    });
  });
});
